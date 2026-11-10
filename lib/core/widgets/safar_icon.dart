import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../tokens/colors.dart';

enum SafarIconType {
  steeringWheel('steering_wheel.svg'),
  key('key.svg'),
  pin('pin.svg'),
  clock('clock.svg'),
  shieldCheck('shield_check.svg'),
  phone('phone.svg'),
  route('route.svg'),
  rupee('rupee.svg'),
  star('star.svg'),
  carSide('car_side.svg'),
  alert('alert.svg');

  final String assetName;
  const SafarIconType(this.assetName);
}

class SafarIcon extends StatelessWidget {
  final SafarIconType type;
  final double size;
  final Color? color;
  final String? semanticLabel;

  const SafarIcon(
    this.type, {
    super.key,
    this.size = 24.0,
    this.color,
    this.semanticLabel,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = color ?? IconTheme.of(context).color ?? SafarColors.ink;
    return SvgPicture.asset(
      'assets/icons/${type.assetName}',
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(effectiveColor, BlendMode.srcIn),
      semanticsLabel: semanticLabel ?? type.name,
    );
  }
}
