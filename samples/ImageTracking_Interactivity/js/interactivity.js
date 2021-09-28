var World = {

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
 
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/magazine.wtc", {
            onError: World.onError
        });

    
        this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
            onTargetsLoaded: World.showInfoBar,
            onError: World.onError
        });

        this.imgButton = new AR.ImageResource("assets/abrir_enlace.png", {
            onError: World.onError
        });

        var pageOneButton = this.createWwwButton("https://www.blue-tomato.com/en-US/products/?q=sup", 0.1, {
            translate: {
                x: 0.0,
                y: 0.0
            },
            zOrder: 1
        });

        this.pageOne = new AR.ImageTrackable(this.tracker, "pageOne", {
            drawables: {
                cam: [pageOneButton]
            },
            onImageRecognized: World.hideInfoBar,
            onError: World.onError
        });

    },

    onError: function onErrorFn(error) {
        alert(error);
    },

    createWwwButton: function createWwwButtonFn(url, size, options) {
        /*
            As the button should be clickable the onClick trigger is defined in the options passed to the
            AR.ImageDrawable. In general each drawable can be made clickable by defining its onClick trigger. The
            function assigned to the click trigger calls AR.context.openInBrowser with the specified URL, which
            opens the URL in the browser.

        */
        options.onClick = function() {
            AR.context.openInBrowser(url);
        };
        return new AR.ImageDrawable(this.imgButton, size, options);
    },

    hideInfoBar: function hideInfoBarFn() {
        document.getElementById("infoBox").style.display = "none";
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("infoBox").style.display = "table";
        document.getElementById("loadingMessage").style.display = "none";
    }
};

World.init();