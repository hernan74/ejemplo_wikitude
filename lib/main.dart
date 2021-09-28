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

Future<List<Category>?> _loadSamples() async {
  String samplesJson = await _loadSamplesJson();
  List<dynamic> categoriesFromJson = json.decode(samplesJson);
  List<Category> categories = [];

  for (int i = 0; i < categoriesFromJson.length; i++) {
    categories.add(new Category.fromJson(categoriesFromJson[i]));
  }
  return categories;
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
      home: Builder(builder: (context) {
        final size = MediaQuery.of(context).size;
        return Scaffold(
            appBar: AppBar(
              title: Text(
                'Modelos Realidad Aumentada',
                style: TextStyle(fontSize: size.height * 0.025),
              ),
              centerTitle: true,
            ),
            body: _Contenido());
      }),
    );
  }
}

class _Contenido extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
          decoration: BoxDecoration(color: Color(0xffdddddd)),
          child: FutureBuilder(
            future: _loadSamples(),
            builder: (context, AsyncSnapshot<List<Category>?> snapshot) {
              if (snapshot.hasData) {
                return Container(
                  decoration: BoxDecoration(color: Colors.white),
                  child: _ListadoFuncionalidades(categorias: snapshot.data!),
                );
              } else {
                return Center(child: CircularProgressIndicator());
              }
            },
          )),
    );
  }
}

class _ListadoFuncionalidades extends StatelessWidget {
  final List<Category> categorias;

  const _ListadoFuncionalidades({Key? key, required this.categorias})
      : super(key: key);
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Wrap(
          children: categorias
              .map((e) =>
                  _Item(titulo: e.categoryName, ejemplo: e.samples.first))
              .toList()),
    );

    //  _CargarArView(
    //   ejemplo: snapshot.data!,
    // );
  }
}

class _Item extends StatelessWidget {
  final String titulo;
  final Sample ejemplo;

  const _Item({Key? key, required this.ejemplo, required this.titulo})
      : super(key: key);
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Card(
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: size.width * 0.019),
        width: size.width * 0.44,
        height: size.height * 0.2,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            Text(
              this.titulo,
              style: TextStyle(
                  fontSize: size.height * 0.02, fontWeight: FontWeight.bold),
            ),
            Text(
              ejemplo.name,
              textAlign: TextAlign.center,
              style: TextStyle(
                  fontSize: size.height * 0.018,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey),
            ),
            IconButton(
                padding: EdgeInsets.zero,
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) =>
                            _CargarArView(ejemplo: this.ejemplo)),
                  );
                },
                icon: Icon(Icons.play_circle,
                    size: size.height * 0.05, color: Colors.green))
          ],
        ),
      ),
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
