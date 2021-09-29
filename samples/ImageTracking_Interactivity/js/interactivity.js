var World = {
    loaded: false,
    tracker: null,
    cloudRecognitionService: null,

    init: function initFn() {
        this.createTracker();
        this.createOverlays();
    },


    createTracker: function createTrackerFn() {
        this.cloudRecognitionService = new AR.CloudRecognitionService(
            "9ad8ff0ab24f3a9ede73bf68db94b132",
            "cN-JeQ8tr",
            "6154b488c932bf0cfe1728bf", {
            onInitialized: World.trackerLoaded,
            onError: World.onError
        }
        );

        World.tracker = new AR.ImageTracker(this.cloudRecognitionService, {
            onError: World.onError
        });
    },

    startContinuousRecognition: function startContinuousRecognitionFn(interval) {

        this.cloudRecognitionService.startContinuousRecognition(interval, this.onInterruption, this.onRecognition, this.onRecognitionError);
    },

    createOverlays: function createOverlaysFn() {

        this.orderNowButtonImg = new AR.ImageResource("assets/abrir_enlace.png", {
            onError: World.onError
        });
        this.orderNowButtonOverlay = new AR.ImageDrawable(this.orderNowButtonImg, 0.2, {
            translate: {
                y: -0.6
            }
        });
    },


    onRecognition: function onRecognitionFn(recognized, response) {
        if (recognized) {

            if (World.wineLabelAugmentation !== undefined) {
                World.wineLabelAugmentation.destroy();
            }

            if (World.model3d !== undefined) {
                World.model3d.destroy();
            }
            if ("3d" == response.metadata.tipo) {
                if (response.metadata.nombre == "car") {
                    this.modelCar = new AR.Model("assets/" + response.metadata.nombre + ".wt3", {
                        onLoaded: World.showInfoBar,
                        onError: World.onError,
                        scale: {
                            x: parseFloat(response.metadata.scale.x),
                            y: parseFloat(response.metadata.scale.y),
                            z: parseFloat(response.metadata.scale.z)
                        },
                        translate: {
                            x: parseFloat(response.metadata.traslate.x),
                            y: parseFloat(response.metadata.traslate.y),
                            z: parseFloat(response.metadata.traslate.z)
                        },
                        rotate: {
                            x: parseFloat(response.metadata.rotate.x),
                            y: parseFloat(response.metadata.rotate.y),
                            z: parseFloat(response.metadata.rotate.z)
                        }
                    });
                    World.wineLabelAugmentation = new AR.ImageTrackable(World.tracker, response.targetInfo.name, {
                        drawables: {
                            cam: [this.modelCar]
                        },
                        onError: World.onError
                    });
                } else {
                    this.dinosaurio = new AR.Model("assets/" + response.metadata.nombre + ".wt3", {
                        onLoaded: World.showInfoBar,
                        onError: World.onError,
                        scale: parseFloat(response.metadata.scale),
                        rotate: {
                            z: 180
                        }
                    });
                    World.wineLabelAugmentation = new AR.ImageTrackable(World.tracker, response.targetInfo.name, {
                        drawables: {
                            cam: [this.dinosaurio]
                        },
                        onError: World.onError
                    });
                }
            } else {

                World.orderNowButtonOverlay.onClick = function () {
                    AR.context.openInBrowser(response.metadata.url);
                };

                World.wineLabelAugmentation = new AR.ImageTrackable(World.tracker, response.targetInfo.name, {
                    drawables: {
                        cam: [World.orderNowButtonOverlay]
                    },
                    onError: World.onError
                });
            }
        }
    },

    onRecognitionError: function onRecognitionErrorFn(errorCode, errorMessage) {
        World.cloudRecognitionService.stopContinuousRecognition();
        alert("error code: " + errorCode + " error message: " + JSON.stringify(errorMessage));
    },
    onInterruption: function onInterruptionFn(suggestedInterval) {
        World.cloudRecognitionService.stopContinuousRecognition();
        World.startContinuousRecognition(suggestedInterval);
    },

    trackerLoaded: function trackerLoadedFn() {
        World.startContinuousRecognition(5000);
        World.showInfoBar();
    },

    onError: function onErrorFn(error) {
        alert(error)
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("loadingMessage").style.display = "none";
    }
};

World.init();