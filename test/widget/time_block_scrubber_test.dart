import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:safar/features/owner_booking/presentation/widgets/time_block_scrubber.dart';

void main() {
  testWidgets('TimeBlockScrubber renders timeline and responds to stepper buttons', (tester) async {
    double start = 9.0;
    double end = 13.0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatefulBuilder(
            builder: (context, setState) {
              return TimeBlockScrubber(
                startHour: start,
                endHour: end,
                onStartChanged: (newStart) => setState(() => start = newStart),
                onEndChanged: (newEnd) => setState(() => end = newEnd),
              );
            },
          ),
        ),
      ),
    );

    // Verifies label and duration badge
    expect(find.text('Time Block Scrubber (24h)'), findsOneWidget);
    expect(find.text('4 Hours'), findsOneWidget);

    // Tap increase button
    await tester.tap(find.byTooltip('Increase duration by 15 minutes'));
    await tester.pump();

    expect(find.text('4.25 Hours'), findsOneWidget);
  });
}
