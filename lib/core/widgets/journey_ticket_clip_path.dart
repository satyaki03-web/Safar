import 'package:flutter/material.dart';

/// Custom ClipPath rendering a journey ticket with side notches and perforation line.
class JourneyTicketClipper extends CustomClipper<Path> {
  final double notchRadius;
  final double notchPositionFromTop;

  const JourneyTicketClipper({
    this.notchRadius = 12.0,
    this.notchPositionFromTop = 130.0,
  });

  @override
  Path getClip(Size size) {
    final path = Path();
    const cornerRadius = 8.0;

    // Top-left corner
    path.moveTo(0, cornerRadius);
    path.arcToPoint(const Offset(cornerRadius, 0), radius: const Radius.circular(cornerRadius));

    // Top edge
    path.lineTo(size.width - cornerRadius, 0);
    path.arcToPoint(Offset(size.width, cornerRadius), radius: const Radius.circular(cornerRadius));

    // Right edge down to notch
    path.lineTo(size.width, notchPositionFromTop - notchRadius);
    // Right inward semi-circle notch
    path.arcToPoint(
      Offset(size.width, notchPositionFromTop + notchRadius),
      radius: Radius.circular(notchRadius),
      clockwise: false,
    );

    // Right edge down to bottom
    path.lineTo(size.width, size.height - cornerRadius);
    path.arcToPoint(Offset(size.width - cornerRadius, size.height), radius: const Radius.circular(cornerRadius));

    // Bottom edge
    path.lineTo(cornerRadius, size.height);
    path.arcToPoint(Offset(0, size.height - cornerRadius), radius: const Radius.circular(cornerRadius));

    // Left edge up to notch
    path.lineTo(0, notchPositionFromTop + notchRadius);
    // Left inward semi-circle notch
    path.arcToPoint(
      Offset(0, notchPositionFromTop - notchRadius),
      radius: Radius.circular(notchRadius),
      clockwise: false,
    );

    // Close path to top-left
    path.lineTo(0, cornerRadius);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(covariant JourneyTicketClipper oldClipper) {
    return oldClipper.notchRadius != notchRadius ||
        oldClipper.notchPositionFromTop != notchPositionFromTop;
  }
}
