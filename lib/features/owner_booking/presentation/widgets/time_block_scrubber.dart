import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/utils/fare_calculator.dart';

class TimeBlockScrubber extends StatefulWidget {
  final double startHour; // e.g. 9.0 (09:00)
  final double endHour; // e.g. 13.0 (13:00)
  final ValueChanged<double> onStartChanged;
  final ValueChanged<double> onEndChanged;

  const TimeBlockScrubber({
    super.key,
    required this.startHour,
    required this.endHour,
    required this.onStartChanged,
    required this.onEndChanged,
  });

  @override
  State<TimeBlockScrubber> createState() => _TimeBlockScrubberState();
}

class _TimeBlockScrubberState extends State<TimeBlockScrubber> {
  int? _activeDragHandle; // 0 = start thumb, 1 = end thumb, 2 = whole block
  double? _dragAnchor;

  double get durationHours => (widget.endHour - widget.startHour).clamp(1.0, 16.0);

  double _snapTo15Min(double hour) {
    return (hour * 4).round() / 4.0;
  }

  void _incrementDuration(double delta) {
    final nextEnd = (widget.endHour + delta).clamp(widget.startHour + 1.0, 24.0);
    widget.onEndChanged(_snapTo15Min(nextEnd));
  }

  String _formatHour(double hour) {
    final totalMinutes = (hour * 60).round();
    final h = (totalMinutes ~/ 60) % 24;
    final m = totalMinutes % 60;
    final period = h >= 12 ? 'PM' : 'AM';
    final displayH = h == 0 ? 12 : (h > 12 ? h - 12 : h);
    return '${displayH.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} $period';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Live duration & timing header
        Row(
          mainAxisAlignment: MainAxisAlignment.between,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Time Block Scrubber (24h)',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: SafarColors.mutedText,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${_formatHour(widget.startHour)} — ${_formatHour(widget.endHour)}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: SafarColors.ink,
                borderRadius: SafarRadii.button,
              ),
              child: Text(
                '${durationHours.toStringAsFixed(durationHours.truncateToDouble() == durationHours ? 0 : 2)} Hours',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: SafarColors.signalYellow,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: SafarSpacing.s12),

        // CustomPainter 24-hour Scrubber Canvas with Gestures
        LayoutBuilder(
          builder: (context, constraints) {
            final trackWidth = constraints.maxWidth;
            const trackHeight = 44.0;

            double hourToX(double hour) => (hour / 24.0) * trackWidth;
            double xToHour(double x) => ((x / trackWidth) * 24.0).clamp(0.0, 24.0);

            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onHorizontalDragStart: (details) {
                final localX = details.localPosition.dx;
                final startX = hourToX(widget.startHour);
                final endX = hourToX(widget.endHour);

                // Detect if user tapped near start thumb, end thumb, or middle block
                if ((localX - startX).abs() < 24) {
                  _activeDragHandle = 0;
                } else if ((localX - endX).abs() < 24) {
                  _activeDragHandle = 1;
                } else if (localX > startX && localX < endX) {
                  _activeDragHandle = 2;
                  _dragAnchor = localX;
                }
              },
              onHorizontalDragUpdate: (details) {
                if (_activeDragHandle == null) return;

                final currentHour = xToHour(details.localPosition.dx);

                if (_activeDragHandle == 0) {
                  // Drag start thumb (min 1h before end)
                  final newStart = _snapTo15Min(currentHour.clamp(0.0, widget.endHour - 1.0));
                  widget.onStartChanged(newStart);
                } else if (_activeDragHandle == 1) {
                  // Drag end thumb (min 1h after start)
                  final newEnd = _snapTo15Min(currentHour.clamp(widget.startHour + 1.0, 24.0));
                  widget.onEndChanged(newEnd);
                } else if (_activeDragHandle == 2 && _dragAnchor != null) {
                  // Slide whole block
                  final dx = details.localPosition.dx - _dragAnchor!;
                  final deltaHours = (dx / trackWidth) * 24.0;
                  final dur = widget.endHour - widget.startHour;
                  final newStart = _snapTo15Min((widget.startHour + deltaHours).clamp(0.0, 24.0 - dur));
                  final newEnd = _snapTo15Min(newStart + dur);
                  widget.onStartChanged(newStart);
                  widget.onEndChanged(newEnd);
                  _dragAnchor = details.localPosition.dx;
                }
              },
              onHorizontalDragEnd: (_) {
                _activeDragHandle = null;
                _dragAnchor = null;
              },
              child: SizedBox(
                width: trackWidth,
                height: trackHeight + 22,
                child: CustomPaint(
                  painter: _ScrubberPainter(
                    startHour: widget.startHour,
                    endHour: widget.endHour,
                  ),
                ),
              ),
            );
          },
        ),

        const SizedBox(height: SafarSpacing.s8),

        // Accessible Stepper Controls for screen readers / fine adjustment
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                IconButton(
                  tooltip: 'Decrease duration by 15 minutes',
                  icon: const Icon(Icons.remove, size: 16, color: SafarColors.ink),
                  style: IconButton.styleFrom(
                    backgroundColor: SafarColors.surface,
                    side: const BorderSide(color: SafarColors.rule),
                    shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                  ),
                  onPressed: durationHours > 1.0 ? () => _incrementDuration(-0.25) : null,
                ),
                const SizedBox(width: SafarSpacing.s4),
                IconButton(
                  tooltip: 'Increase duration by 15 minutes',
                  icon: const Icon(Icons.add, size: 16, color: SafarColors.ink),
                  style: IconButton.styleFrom(
                    backgroundColor: SafarColors.surface,
                    side: const BorderSide(color: SafarColors.rule),
                    shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                  ),
                  onPressed: durationHours < 16.0 ? () => _incrementDuration(0.25) : null,
                ),
              ],
            ),
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: SafarColors.nightScrubberTint,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'Night Surcharge (10 PM–6 AM)',
                  style: theme.textTheme.bodySmall?.copyWith(fontSize: 10),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

class _ScrubberPainter extends CustomPainter {
  final double startHour;
  final double endHour;

  _ScrubberPainter({required this.startHour, required this.endHour});

  @override
  void paint(Canvas canvas, Size size) {
    const trackHeight = 44.0;
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, trackHeight),
      const Radius.circular(SafarRadii.r6),
    );

    // 1. Background Paper fill
    final bgPaint = Paint()..color = SafarColors.paper;
    canvas.drawRRect(rrect, bgPaint);

    // 2. Night hour tints (00:00 to 06:00 and 22:00 to 24:00)
    final nightPaint = Paint()..color = SafarColors.nightScrubberTint;

    final night1Width = (6.0 / 24.0) * size.width;
    canvas.drawRect(Rect.fromLTWH(0, 0, night1Width, trackHeight), nightPaint);

    final night2Start = (22.0 / 24.0) * size.width;
    canvas.drawRect(
      Rect.fromLTWH(night2Start, 0, size.width - night2Start, trackHeight),
      nightPaint,
    );

    // 3. Border outline
    final borderPaint = Paint()
      ..color = SafarColors.rule
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    canvas.drawRRect(rrect, borderPaint);

    // 4. Tick marks for every 3 hours
    final tickPaint = Paint()
      ..color = SafarColors.rule
      ..strokeWidth = 1.0;

    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int h = 0; h <= 24; h += 3) {
      final x = (h / 24.0) * size.width;
      canvas.drawLine(Offset(x, trackHeight - 8), Offset(x, trackHeight), tickPaint);

      // Label under track
      final labelText = h == 0 || h == 24
          ? '12A'
          : h == 12
              ? '12P'
              : h < 12
                  ? '${h}A'
                  : '${h - 12}P';

      textPainter.text = TextSpan(
        text: labelText,
        style: const TextStyle(
          color: SafarColors.mutedText,
          fontSize: 9.0,
          fontWeight: FontWeight.w600,
          fontFamily: 'IBM Plex Mono',
        ),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(x - (textPainter.width / 2), trackHeight + 4));
    }

    // 5. Selected Active Time Block (signalYellow)
    final startX = (startHour / 24.0) * size.width;
    final endX = (endHour / 24.0) * size.width;

    final activeRect = Rect.fromLTRB(startX, 0, endX, trackHeight);
    final activePaint = Paint()..color = SafarColors.signalYellow.withOpacity(0.9);
    canvas.drawRect(activeRect, activePaint);

    final activeBorder = Paint()
      ..color = SafarColors.ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRect(activeRect, activeBorder);

    // 6. Start and End Thumbs (Square caps, 1px Rule)
    final thumbPaint = Paint()..color = SafarColors.ink;
    const thumbWidth = 6.0;

    // Start handle
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(startX, trackHeight / 2), width: thumbWidth, height: trackHeight - 6),
        const Radius.circular(2),
      ),
      thumbPaint,
    );

    // End handle
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(endX, trackHeight / 2), width: thumbWidth, height: trackHeight - 6),
        const Radius.circular(2),
      ),
      thumbPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScrubberPainter oldDelegate) {
    return oldDelegate.startHour != startHour || oldDelegate.endHour != endHour;
  }
}
