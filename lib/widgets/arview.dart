import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:ejemplo_wikitude/models/applicationModelPois.dart';
import 'package:ejemplo_wikitude/models/poi.dart';
import 'package:ejemplo_wikitude/models/poiDetails.dart';
import 'package:ejemplo_wikitude/models/sample.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:wakelock/wakelock.dart';
import 'package:path_provider/path_provider.dart';

import 'package:augmented_reality_plugin_wikitude/architect_widget.dart';
import 'package:augmented_reality_plugin_wikitude/wikitude_response.dart';

class ArViewState extends State<ArViewWidget> with WidgetsBindingObserver {
  late ArchitectWidget architectWidget;
  String wikitudeTrialLicenseKey =
      "FhZhGSlcVIa8NDqWgZJbWzm+teBFSdCRNsmSUVl7R0jfWzZD/unapCly7b689v3RhMOrLHMoeaFPtrjY9fJCkBqsyqofkJkLTsf5S9lUhEyzXjgxEoes9npPE9Fo5weXFEJoNFTaOIjO0Mspt92KJU0WuF/y0kecH1M+xiLv7tNTYWx0ZWRfX2moaDumUj0CnD8QNzhJJZHi4VvFgAYiGUBE7B+oUmsvDKa0AjvD03tKTsPTRjBb/3MG+Fx0HjTXRNCvwOgMgn7loxBdoAfkiIySUaQTSPPqEREJzog2u5WJhumlATtHAdF8YESAtJIIPk6GxLvqXZkzcXFlBIItU07LeJgiXYEhw6k/BkbDYu/QdXf+/4dj2MaCGBxSUR+DPFTSAjl51U5v/WRBaYEA8nn/0zNbA8k2ibuEVuwavS03NbXA+gsG+1uuJrQKY9d/NefHZJgGRmTpPUygdtYTH3gWFJSRrwoVIQaUyWOsX6aSyVRa2ETHNMO4zpiBajtNkS1f19EeBWHgH80sxKxdz5VqneQqxEiHFStXQMF+m2hYRgwieqjWT2dyYY3/aq3sgtyZ/fGtPDHtNLWoukz6Wug2j1BbPP7NcvpcNNnXOn1Y2Etg7xybduegIu8VXukYbbdL7UA+ysNQ/k9pnPAwNsxcydoZyg+cakHR0uA99oBehOKhJKFM2jMPNPdTmg9ISGT9wZbLeNJrRggZL1SCZTT4H7W/ULNbwHmEQyASbhTJbtye+WCTw9LY8LatUJZ5ar37UJ5MdMArPLl3ssy8uHF0yAWsEZFR8e6t7akJ0kpP+xA3dJ2YVIQZD4xTM/AxzsSZfp8n+KDhxHe8gb68gZu4Nh8G+RbZZ9vgTJ5R+U8=";
  Sample sample;
  String loadPath = "";
  bool loadFailed = false;

  ArViewState({required this.sample}) {
    if (this.sample.path.contains("http://") ||
        this.sample.path.contains("https://")) {
      loadPath = this.sample.path;
    } else {
      loadPath = "samples/" + this.sample.path;
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance!.addObserver(this);

    architectWidget = new ArchitectWidget(
      onArchitectWidgetCreated: onArchitectWidgetCreated,
      licenseKey: wikitudeTrialLicenseKey,
      startupConfiguration: sample.startupConfiguration,
      features: sample.requiredFeatures,
    );

    Wakelock.enable();
  }

  @override
  void dispose() {
    this.architectWidget.pause();
    this.architectWidget.destroy();
    WidgetsBinding.instance!.removeObserver(this);

    Wakelock.disable();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.paused:
        this.architectWidget.pause();
        break;
      case AppLifecycleState.resumed:
        this.architectWidget.resume();
        break;

      default:
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(title: Text(sample.name)),
        body: WillPopScope(
          onWillPop: () async {
            if (defaultTargetPlatform == TargetPlatform.android &&
                !loadFailed) {
              bool? canWebViewGoBack =
                  await this.architectWidget.canWebViewGoBack();
              if (canWebViewGoBack != null) {
                return !canWebViewGoBack;
              } else {
                return true;
              }
            } else {
              return true;
            }
          },
          child: Container(
              decoration: BoxDecoration(color: Colors.black),
              child: architectWidget),
        ));
  }

  Future<void> onArchitectWidgetCreated() async {
    this.architectWidget.load(loadPath, onLoadSuccess, onLoadFailed);
    this.architectWidget.resume();

    if (sample.requiredExtensions.contains("application_model_pois")) {
      List<Poi> pois = await ApplicationModelPois.prepareApplicationDataModel();
      this.architectWidget.callJavascript(
          "World.loadPoisFromJsonData(" + jsonEncode(pois) + ");");
    }

    if ((sample.requiredExtensions.contains("screenshot") ||
        sample.requiredExtensions.contains("save_load_instant_target") ||
        sample.requiredExtensions.contains("native_detail"))) {
      this.architectWidget.setJSONObjectReceivedCallback(onJSONObjectReceived);
    }
  }

  Future<void> onJSONObjectReceived(Map<String, dynamic> jsonObject) async {
    if (jsonObject["action"] != null) {
      switch (jsonObject["action"]) {
        case "capture_screen":
          captureScreen();
          break;
        case "present_poi_details":
          Navigator.push(
            context,
            MaterialPageRoute(
                builder: (context) => PoiDetailsWidget(
                    id: jsonObject["id"],
                    title: jsonObject["title"],
                    description: jsonObject["description"])),
          );
          break;
        case "save_current_instant_target":
          final fileDirectory = await getApplicationDocumentsDirectory();
          final filePath = fileDirectory.path;
          final file = File('$filePath/SavedAugmentations.json');
          file.writeAsString(jsonObject["augmentations"]);
          this.architectWidget.callJavascript(
              "World.saveCurrentInstantTargetToUrl(\"" +
                  filePath +
                  "/SavedInstantTarget.wto" +
                  "\");");
          break;
        case "load_existing_instant_target":
          final fileDirectory = await getApplicationDocumentsDirectory();
          final filePath = fileDirectory.path;
          final file = File('$filePath/SavedAugmentations.json');
          String augmentations;
          try {
            augmentations = await file.readAsString();
          } catch (e) {
            augmentations = "null";
          }
          this.architectWidget.callJavascript(
              "World.loadExistingInstantTargetFromUrl(\"" +
                  filePath +
                  "/SavedInstantTarget.wto" +
                  "\"," +
                  augmentations +
                  ");");
          break;
      }
    }
  }

  Future<void> captureScreen() async {
    WikitudeResponse captureScreenResponse =
        await this.architectWidget.captureScreen(true, "");
    if (captureScreenResponse.success) {
      this.architectWidget.showAlert(
          "Success", "Image saved in: " + captureScreenResponse.message);
    } else {
      if (captureScreenResponse.message.contains("permission")) {
        this
            .architectWidget
            .showAlert("Error", captureScreenResponse.message, true);
      } else {
        this.architectWidget.showAlert("Error", captureScreenResponse.message);
      }
    }
  }

  Future<void> onLoadSuccess() async {
    loadFailed = false;
  }

  Future<void> onLoadFailed(String error) async {
    loadFailed = true;
    this.architectWidget.showAlert("Failed to load Architect World", error);
  }
}

class ArViewWidget extends StatefulWidget {
  final Sample sample;

  ArViewWidget({
    Key? key,
    required this.sample,
  });

  @override
  ArViewState createState() => new ArViewState(sample: sample);
}
