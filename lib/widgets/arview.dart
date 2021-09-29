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
      "xAJWvw2CC59OcJTp+ICpogqa91HiIa7SFSJMjMM1SV6CeKOkQdBcmDGpISPfXLmHO6RvaIGucLv2RYDwoM/WyTDui8gBee9f1J9uByPBXTvFAy9G9ZBPsFqDEng00UXvKU5CKit6AxqUqXOhb3ctDZ0bL89DbEhUInfoJjAOgtNTYWx0ZWRfXwfx3bRVWJAPT6JZBsn9vMQuDto0FUqnDHr1ZRxzOAfJu/M9FlYuYcXBHUm+w4nOHXp1h5VWQgobRaLJ9/gbQ451t61pxJ1kQcz0TjPzZ6wMIROs1+yLU/aDaLnBTqzC17+xizFgWeYj5NubmTyQmhW6xVlFGlJg2sMTqopzurjISgsyhx1efnCZwXkxze/84+ok8C9NMIiASl6Nn/LzfGw0hMkCLZgB6eFc40SeDVLbycrxLQCt08SAq/uRnp6sj6pZFar1CCBGYJGsx7Yr4BTcFjQKPEQT+myJCVe90WvtFN9dPeorcu0kYG5/vUyGOrsjBZcv7317Gj96+ijZ5OcS8c4Th9Q516YSLTwR5QagQiH64KWMFPhj+XskeXVSC7uNxWmLgIBA7ZvPj6nbmVhhNIVx+LegWgbWt/7QnFPhH6qDguzWb6/Ql8csk/upuXiAks/i8eZsxA3u63MudrH0+IphG2gLcU5kuNtHfm6vcG+xNE12+saWfnneAe9QjIbzJM5p54rejYgSl98J0tqST8lg2YCcG2jVncHh4vn5H2C5baQe+weR7xGLnIUxnOh8mFDUxsCXxnWbSZJEqCUqQMXKwEmKu3lWYNq5GuxEAmwI+dNENc0Y/M7b0fZR1R+7ChOjNCiRl5EdVtLzJgN6kq7iYpbd8aDh79N23M59lsQ17twe8fo=";
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
        body: SafeArea(
      child: WillPopScope(
        onWillPop: () async {
          if (defaultTargetPlatform == TargetPlatform.android && !loadFailed) {
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
        child: Stack(
          children: [
            Container(
                decoration: BoxDecoration(color: Colors.black),
                child: architectWidget),
            IconButton(
                onPressed: () async {
                  if (defaultTargetPlatform == TargetPlatform.android &&
                      !loadFailed) {
                    bool? canWebViewGoBack =
                        await this.architectWidget.canWebViewGoBack();
                    if (canWebViewGoBack != null) {
                      if (!canWebViewGoBack) Navigator.of(context).pop();
                    } else {
                      Navigator.of(context).pop();
                    }
                  } else {
                    Navigator.of(context).pop();
                  }
                },
                icon: Icon(Icons.arrow_back_ios_new_rounded)),
          ],
        ),
      ),
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
