import 'dart:convert';

import 'package:augmented_reality_plugin_wikitude/wikitude_plugin.dart';
import 'package:augmented_reality_plugin_wikitude/wikitude_response.dart';
import 'package:ejemplo_wikitude/models/category.dart';
import 'package:ejemplo_wikitude/models/sample.dart';
import 'package:ejemplo_wikitude/widgets/arview.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() => runApp(MyApp());

///Carga el modelo
Future<String> _loadSamplesJson() async {
  return await rootBundle.loadString('samples/samples.json');
}

Future<Sample?> _loadSamples() async {
  String samplesJson = await _loadSamplesJson();
  List<dynamic> categoriesFromJson = json.decode(samplesJson);

  if (categoriesFromJson.length > 0) {
    final Sample sample =
        new Category.fromJson(categoriesFromJson[0]).samples.first;
    return sample;
  }

  return null;
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Material App',
      home: Scaffold(
          body: Container(
              decoration: BoxDecoration(color: Color(0xffdddddd)),
              child: FutureBuilder(
                future: _loadSamples(),
                builder: (context, AsyncSnapshot<Sample?> snapshot) {
                  if (snapshot.hasData) {
                    return Container(
                      decoration: BoxDecoration(color: Colors.white),
                      child: _CargarArView(
                        ejemplo: snapshot.data!,
                      ),
                    );
                  } else {
                    return Center(child: CircularProgressIndicator());
                  }
                },
              ))),
    );
  }
}

class _CargarArView extends StatelessWidget {
  final Sample ejemplo;

  const _CargarArView({Key? key, required this.ejemplo}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
        future: _isDeviceSupporting(ejemplo.requiredFeatures),
        builder: (context, AsyncSnapshot<WikitudeResponse> snapshot) {
          if (snapshot.hasData) {
            if (snapshot.data!.success) {
              return ArViewWidget(sample: this.ejemplo);
            } else
              return Center(child: Text(snapshot.data!.message));
          } else {
            return Center(child: CircularProgressIndicator());
          }
        });
  }

  Future<WikitudeResponse> _isDeviceSupporting(List<String> features) async {
    final deviceSupport = await WikitudePlugin.isDeviceSupporting(features);
    if (!deviceSupport.success) {
      return deviceSupport;
    }
    final permisosRequiered =
        await WikitudePlugin.requestARPermissions(features);

    return permisosRequiered;
  }
}
