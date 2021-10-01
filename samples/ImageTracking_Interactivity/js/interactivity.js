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
                    World.modelCar = new AR.Model("assets/car.wt3", {
                        onClick: World.toggleAnimateModel,
                        onLoaded: World.showInfoBar,
                        onError: World.onError,
                        scale: {
                            x: 0.0,
                            y: 0.0,
                            z: 0.0
                        },
                        translate: {
                            x: 0.0,
                            y: 0.05,
                            z: 0.0
                        },
                        rotate: {
                            z: 335
                        },
                        onScaleBegan: World.onScaleBegan,
                        onScaleChanged: World.onScaleChanged,
                        onDragChanged: function (x, y) {
                            if (World.snapped) {
                                var movement = {
                                    x: 0,
                                    y: 0
                                };

                                movement.x = World.previousDragValue.x - x;
                                movement.y = World.previousDragValue.y - y;

                                this.rotate.y += (Math.cos(this.rotate.z * Math.PI / 180) * movement.x *
                                    -1 + Math.sin(this.rotate.z * Math.PI / 180) * movement.y) * 180;
                                this.rotate.x += (Math.cos(this.rotate.z * Math.PI / 180) * movement.y +
                                    Math.sin(this.rotate.z * Math.PI / 180) * movement.x) * -180;

                                World.previousDragValue.x = x;
                                World.previousDragValue.y = y;
                            }
                        },
                        onDragEnded: function ( /*x, y*/) {
                            if (World.snapped) {
                                World.previousDragValue.x = 0;
                                World.previousDragValue.y = 0;
                            }
                        },
                        onRotationChanged: function (angleInDegrees) {
                            this.rotate.z = previousRotationValue - angleInDegrees;
                        },
                        onRotationEnded: function ( /*angleInDegrees*/) {
                            previousRotationValue = this.rotate.z
                        }
                    });

                    World.appearingAnimation = World.createAppearingAnimation(World.modelCar, 0.045);

                    World.rotationAnimation = new AR.PropertyAnimation(World.modelCar, "rotate.z", -25, 335, 10000);

                    var imgRotate = new AR.ImageResource("assets/rotateButton.png", {
                        onError: World.onError
                    });
                    World.buttonRotate = new AR.ImageDrawable(imgRotate, 0.2, {
                        translate: {
                            x: 0.35,
                            y: 0.45
                        },
                        onClick: World.toggleAnimateModel
                    });

                    var imgSnap = new AR.ImageResource("assets/snapButton.png", {
                        onError: World.onError
                    });
                    World.buttonSnap = new AR.ImageDrawable(imgSnap, 0.2, {
                        translate: {
                            x: -0.35,
                            y: -0.45
                        },
                        onClick: World.toggleSnapping
                    });

                    World.trackable = new AR.ImageTrackable(World.tracker, "*", {
                        drawables: {
                            cam: [World.modelCar, World.buttonRotate, World.buttonSnap]
                        },
                        snapToScreen: {
                            snapContainer: document.getElementById('snapContainer')
                        },
                        onImageRecognized: World.appear,
                        onError: World.onError
                    });
                    // var imgRotate = new AR.ImageResource("assets/rotateButton.png", {
                    //     onError: World.onError
                    // });
                    // this.buttonRotate = new AR.ImageDrawable(imgRotate, 0.2, {
                    //     translate: {
                    //         x: 0.35,
                    //         y: 0.45
                    //     },
                    //     // onClick: World.toggleAnimateModel
                    // });

                    // this.modelCar = new AR.Model("assets/" + response.metadata.nombre + ".wt3", {
                    //     // onClick: World.toggleAnimateModel,
                    //     onLoaded: World.showInfoBar,
                    //     onError: World.onError,
                    //     scale: {
                    //         x: parseFloat(response.metadata.scale.x),
                    //         y: parseFloat(response.metadata.scale.y),
                    //         z: parseFloat(response.metadata.scale.z)
                    //     },
                    //     translate: {
                    //         x: parseFloat(response.metadata.traslate.x),
                    //         y: parseFloat(response.metadata.traslate.y),
                    //         z: parseFloat(response.metadata.traslate.z)
                    //     },
                    //     rotate: {
                    //         x: parseFloat(response.metadata.rotate.x),
                    //         y: parseFloat(response.metadata.rotate.y),
                    //         z: parseFloat(response.metadata.rotate.z)
                    //     }, 

                    //     onRotationEnded: function ( /*angleInDegrees*/) {
                    //         previousRotationValue = this.rotate.z
                    //     }
                    // });


                    // World.wineLabelAugmentation = new AR.ImageTrackable(World.tracker, response.targetInfo.name, {
                    //     drawables: {
                    //         cam: [this.modelCar, this.buttonRotate]
                    //     },
                    //     onError: World.onError
                    // });
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
    createAppearingAnimation: function createAppearingAnimationFn(model, scale) {

        var sx = new AR.PropertyAnimation(model, "scale.x", 0, scale, 1500, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
        });
        var sy = new AR.PropertyAnimation(model, "scale.y", 0, scale, 1500, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
        });
        var sz = new AR.PropertyAnimation(model, "scale.z", 0, scale, 1500, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
        });

        return new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [sx, sy, sz]);
    },
    onInterruption: function onInterruptionFn(suggestedInterval) {
        World.cloudRecognitionService.stopContinuousRecognition();
        World.startContinuousRecognition(suggestedInterval);
    },
    trackerLoaded: function trackerLoadedFn() {
        World.startContinuousRecognition(5000);
        World.showInfoBar();
    },
    appear: function appearFn() {
        if (!World.snapped) {
            /* Resets the properties to the initial values. */
            World.resetModel();
            World.appearingAnimation.start();
        }
    },
    onRecognitionError: function onRecognitionError(errorCode, errorMessage) {
        alert("error code: " + errorCode + " error message: " + JSON.stringify(errorMessage));
    },
    resetModel: function resetModelFn() {
        World.rotationAnimation.stop();
        World.rotating = false;
        World.modelCar.rotate.x = 0;
        World.modelCar.rotate.y = 0;
        World.modelCar.rotate.z = 335;
    },

    toggleAnimateModel: function toggleAnimateModelFn() {
        if (!World.rotationAnimation.isRunning()) {
            if (!World.rotating) {
                World.rotationAnimation.start(-1);
                World.rotating = true;
            } else {
                World.rotationAnimation.resume();
            }
        } else {
            World.rotationAnimation.pause();
        }

        return false;
    },

    toggleSnapping: function toggleSnappingFn() {

        if (World.appearingAnimation.isRunning()) {
            World.appearingAnimation.stop();
        }
        World.snapped = !World.snapped;
        World.trackable.snapToScreen.enabled = World.snapped;

        if (World.snapped) {
            World.applyLayout(World.layout.snapped);

        } else {
            World.applyLayout(World.layout.normal);
        }
    },

    applyLayout: function applyLayoutFn(layout) {

        World.buttonRotate.translate.x = layout.offsetX;
        World.buttonRotate.translate.y = layout.offsetY;

        World.buttonSnap.translate.x = -layout.offsetX;
        World.buttonSnap.translate.y = -layout.offsetY;

        World.buttonRotate.scale.x = 1;
        World.buttonRotate.scale.y = 1;
        World.buttonSnap.scale.x = 1;
        World.buttonSnap.scale.y = 1;

        World.modelCar.scale = {
            x: layout.carScale,
            y: layout.carScale,
            z: layout.carScale
        };

        World.defaultScale = layout.carScale;

        World.modelCar.translate = {
            x: 0.0,
            y: layout.carTranslateY,
            z: 0.0
        };
    },

    onScaleBegan: function onScaleBeganFn( /*scale*/) {
        if (World.snapped) {
            World.previousScaleValue = World.modelCar.scale.x;
            World.previousScaleValueButtons = World.buttonRotate.scale.x;

            World.previousTranslateValueRotate.x = World.buttonRotate.translate.x;
            World.previousTranslateValueRotate.y = World.buttonRotate.translate.y;

            World.previousTranslateValueSnap.x = World.buttonSnap.translate.x;
            World.previousTranslateValueSnap.y = World.buttonSnap.translate.y;
        }
    },

    onScaleChanged: function onScaleChangedFn(scale) {
        if (World.snapped) {
            var carScale = World.previousScaleValue * scale;
            World.modelCar.scale = {
                x: carScale,
                y: carScale,
                z: carScale
            };

            var buttonRotateScale = World.previousScaleValueButtons * scale;
            World.buttonRotate.scale = {
                x: buttonRotateScale,
                y: buttonRotateScale
            };

            var buttonSnapScale = World.buttonRotate.scale.x;
            World.buttonSnap.scale = {
                x: buttonSnapScale,
                y: buttonSnapScale
            };

            World.buttonRotate.translate = {
                x: World.previousTranslateValueRotate.x * scale,
                y: World.previousTranslateValueRotate.y * scale
            };

            World.buttonSnap.translate = {
                x: World.previousTranslateValueSnap.x * scale,
                y: World.previousTranslateValueSnap.y * scale
            }
        }
    },

    onError: function onErrorFn(error) {
        alert(error);
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("loadingMessage").style.display = "none";
    }
};

World.init();