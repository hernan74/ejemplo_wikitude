var World = {
    loaded: false,
    tracker: null,
    cloudRecognitionService: null,
    rotating: false,
    snapped: false,
    interactionContainer: 'snapContainer',
    layout: {
        normal: {
            offsetX: 0.35,
            offsetY: 0.45,
            opacity: 0.0,
            carScale: 0.045,
            carTranslateY: 0.05
        },
        snapped: {
            offsetX: 0.45,
            offsetY: 0.45,
            opacity: 0.2,
            carScale: 0.08,
            carTranslateY: 0
        }
    },
    previousDragValue: {
        x: 0,
        y: 0
    },
    previousScaleValue: 0,
    previousScaleValueButtons: 0,
    previousRotationValue: 0,
    previousTranslateValueRotate: {
        x: 0,
        y: 0
    },
    previousTranslateValueSnap: {
        x: 0,
        y: 0
    },
    defaultScale: 0,
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
                    var imgRotate = new AR.ImageResource("assets/rotateButton.png", {
                        onError: World.onError
                    });
                    this.buttonRotate = new AR.ImageDrawable(imgRotate, 0.2, {
                        translate: {
                            x: 0.35,
                            y: 0.45
                        },
                        // onClick: World.toggleAnimateModel
                    });

                    this.modelCar = new AR.Model("assets/" + response.metadata.nombre + ".wt3", {
                        // onClick: World.toggleAnimateModel,
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

                    this.rotationAnimation = new AR.PropertyAnimation(this.modelCar, "rotate.z", -25, 335, 10000);
                    World.wineLabelAugmentation = new AR.ImageTrackable(World.tracker, response.targetInfo.name, {
                        drawables: {
                            cam: [this.modelCar, this.buttonRotate]
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
    toggleAnimateModel: function toggleAnimateModelFn() {
        if (!World.rotationAnimation.isRunning()) {
            if (!World.rotating) {
                /* Starting an animation with .start(-1) will loop it indefinitely. */
                World.rotationAnimation.start(-1);
                World.rotating = true;
            } else {
                /* Resumes the rotation animation */
                World.rotationAnimation.resume();
            }
        } else {
            /* Pauses the rotation animation */
            World.rotationAnimation.pause();
        }

        return false;
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