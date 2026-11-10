import 'package:flutter/material.dart';
import '../tokens/colors.dart';
import '../tokens/radii.dart';

enum RideProgressStep {
  assigned('Assigned'),
  enRoute('En Route'),
  arrived('Arrived'),
  active('Active');

  final String label;
  const RideProgressStep(this.label);
}

class StatusRail extends StatelessWidget {
  final RideProgressStep currentStep;

  const StatusRail({super.key, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    final steps = RideProgressStep.values;
    final currentIndex = steps.indexOf(currentStep);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: SafarColors.paper,
        borderRadius: SafarRadii.card,
        border: Border.all(color: SafarColors.rule),
      ),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Connector line
            final stepIndex = index ~/ 2;
            final isPassed = stepIndex < currentIndex;
            return Expanded(
              child: Container(
                height: 2.0,
                color: isPassed ? SafarColors.ink : SafarColors.rule,
              ),
            );
          }

          // Step Node
          final stepIndex = index ~/ 2;
          final isCurrent = stepIndex == currentIndex;
          final isCompleted = stepIndex < currentIndex;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCurrent
                      ? SafarColors.signalYellow
                      : isCompleted
                          ? SafarColors.ink
                          : SafarColors.surface,
                  border: Border.all(
                    color: isCurrent || isCompleted ? SafarColors.ink : SafarColors.rule,
                    width: 1.5,
                  ),
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, size: 12, color: SafarColors.surface)
                      : Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isCurrent ? SafarColors.ink : SafarColors.rule,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                steps[stepIndex].label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                  color: isCurrent ? SafarColors.ink : SafarColors.mutedText,
                  fontFamily: 'Schibsted Grotesk',
                ),
              ),
            ],
          );
        }),
      ),
    );
  }
}
