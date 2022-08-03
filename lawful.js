let frontmatter = null;

window.quillEditor = new Quill(document.getElementById("editor"), {
    theme: "snow",
    modules: {
        toolbar: [
            [{"header": [1, 2, 3, 4, 5, false]}],
            ["bold", "italic", "underline", "strike"],
            [{"color": []}, {"background": []}],
            [{"align": []}, {"indent": "-1"}, {"indent": "+1"}, {"list": "ordered"}, {"list": "bullet"}],
            ["blockquote", "code-block"],
            ["link", "image", "video"],
            ["clean"]
        ]
    }
});

$(function() {
    window.sourceDialog = $("<textarea></textarea>").dialog({
        title: "Paste in your Quill document source below",
        autoOpen: false,
        height: 400,
        width: 600,
        modal: true,
        buttons: {
            Apply: function () {
                const self = $(this);
                const previousMatter = frontmatter;
                let matter = parseGreyMatter(self.val());
                let contents;
                try {
                    contents = JSON.parse(matter.content);
                }
                catch (e) {
                    self.dialog("close");
                    $(function() {
                        $("<div><p>Could not parse that Quill document source!</p></div>").dialog({
                            title: "Error!"
                        });
                    });
                    return;
                }
                const previousSource = quillEditor.getContents();
                try {
                    quillEditor.setContents(contents);
                }
                catch (e) {
                    quillEditor.setContents(previousSource);
                    self.dialog("close");
                    $(function() {
                        $("<div><p>Could not apply that Quill document source!</p></div>").dialog({
                            title: "Error!"
                        });
                    });
                    return;
                }
                frontmatter = matter.matter;
                self.dialog("close");
            }
        },
        open: function () {
            $(this)
                .val("") // Clear the textarea
                .outerWidth("100%")
                .attr({ readonly: false })
                .focus();
        }
    });
    $("#import-button").button().on("click", function () {
        sourceDialog.dialog("open");
    });

    window.exportDialog = $("<textarea></textarea>").dialog({
        title: "Contained below is your Quill document's source",
        autoOpen: false,
        height: 400,
        width: 600,
        modal: true,
        buttons: {
            "Select All": function () {
                $(this).select();
            },
            Close: function () {
                $(this).dialog("close");
            }
        },
        open: function () {
            let stringifiedContents = JSON.stringify(quillEditor.getContents() ?? {}, null, 4);
            if (frontmatter) {
                stringifiedContents
                    = "---"
                    + (!frontmatter.startsWith("\n") ? "\n" : "")
                    + frontmatter
                    + (!frontmatter.endsWith("\n") ? "\n" : "")
                    + "---"
                    + "\n"
                    + stringifiedContents;
            }
            $(this)
                .val(stringifiedContents)
                .outerWidth("100%")
                .attr({ readonly: true });
        }
    });
    $("#export-button").button().on("click", function () {
        exportDialog.dialog("open");
    });
});

const QL_EDITOR = $("#editor");
const QL_TOOLBAR = $(".ql-toolbar");
let previousScrollPos = $(this).scrollTop();
function keepQuillToolbarVisible() {
    const scrollPos = $(this).scrollTop();
    const thresholdPos = QL_EDITOR.position().top + parseFloat(QL_EDITOR.css("marginTop")) - QL_TOOLBAR.outerHeight();
    if (previousScrollPos <= thresholdPos && scrollPos > thresholdPos) {
        QL_TOOLBAR.css({
            position: "fixed"
        });
        QL_EDITOR.css({
            marginTop: QL_TOOLBAR.outerHeight()
        });
    }
    else if (previousScrollPos > thresholdPos && scrollPos < thresholdPos) {
        QL_TOOLBAR.css({
            position: ""
        });
        QL_EDITOR.css({
            marginTop: 0
        });
    }
    previousScrollPos = scrollPos;
}
$(window)
    .scroll(keepQuillToolbarVisible)
    .ready(keepQuillToolbarVisible);

// Quill will reset your scroll back to 0 on certain operations which
// makes editing longer documents a real PITA
quillEditor.on("text-change", function () {
    if (previousScrollPos !== 0 && $(window).scrollTop() === 0) {
        $(window).scrollTop(previousScrollPos);
    }
});