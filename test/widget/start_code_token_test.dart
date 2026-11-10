import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:safar/core/widgets/start_code_token.dart';

void main() {
  testWidgets('StartCodeToken renders each digit in a separate token box', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: StartCodeToken(code: '4829'),
          ),
        ),
      ),
    );

    expect(find.text('4'), findsOneWidget);
    expect(find.text('8'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('9'), findsOneWidget);
  });
}
