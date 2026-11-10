import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/tokens/colors.dart';
import '../../../../core/tokens/spacing.dart';
import '../../../../core/tokens/radii.dart';
import '../../../../core/widgets/safar_icon.dart';
import '../../domain/user_entity.dart';

class RoleChoiceScreen extends ConsumerStatefulWidget {
  const RoleChoiceScreen({super.key});

  @override
  ConsumerState<RoleChoiceScreen> createState() => _RoleChoiceScreenState();
}

class _RoleChoiceScreenState extends ConsumerState<RoleChoiceScreen> {
  UserRole _selectedRole = UserRole.owner;
  int _step = 0; // 0 = role select, 1 = phone, 2 = otp

  final _nameController = TextEditingController(text: 'Debashis Banerjee');
  final _phoneController = TextEditingController(text: '9830144521');
  final _otpController = TextEditingController(text: '4829');
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _onRoleTapped(UserRole role) {
    setState(() {
      _selectedRole = role;
      if (role == UserRole.driver) {
        _nameController.text = 'Subhashish Das';
        _phoneController.text = '9830012894';
      } else if (role == UserRole.both) {
        _nameController.text = 'Sourav Ganguly';
        _phoneController.text = '9831099001';
      } else {
        _nameController.text = 'Debashis Banerjee';
        _phoneController.text = '9830144521';
      }
      _step = 1;
    });
  }

  void _verifyOtp() {
    if (_otpController.text.length != 4) {
      setState(() => _errorMessage = 'Please enter a 4-digit verification code.');
      return;
    }

    if (_selectedRole == UserRole.driver) {
      context.go('/driver');
    } else {
      context.go('/owner');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: SafarColors.paper,
      appBar: AppBar(
        backgroundColor: SafarColors.paper,
        elevation: 0,
        leading: _step > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: SafarColors.ink),
                onPressed: () => setState(() => _step--),
              )
            : null,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: SafarSpacing.s24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_step == 0) ...[
                Text('Account Setup', style: theme.textTheme.bodySmall?.copyWith(fontFamily: 'IBM Plex Mono')),
                const SizedBox(height: 4),
                Text('Choose your role', style: theme.textTheme.displayMedium),
                const SizedBox(height: 8),
                Text(
                  'Select how you will primarily use Safar across Kolkata.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: SafarColors.mutedText),
                ),
                const SizedBox(height: SafarSpacing.s24),

                // Option 1: Car Owner
                _RoleCard(
                  title: 'I own a car',
                  badge: 'Owner',
                  description: 'Hire verified professional drivers by the hour to navigate Kolkata in your personal car.',
                  icon: SafarIconType.carSide,
                  isSelected: _selectedRole == UserRole.owner,
                  onTap: () => _onRoleTapped(UserRole.owner),
                ),
                const SizedBox(height: SafarSpacing.s12),

                // Option 2: Professional Driver
                _RoleCard(
                  title: 'I am a professional driver',
                  badge: 'Driver',
                  description: 'Hold a commercial driving licence and earn ₹180/hr driving owners\' personal cars.',
                  icon: SafarIconType.steeringWheel,
                  isSelected: _selectedRole == UserRole.driver,
                  onTap: () => _onRoleTapped(UserRole.driver),
                ),
                const SizedBox(height: SafarSpacing.s12),

                // Option 3: Both
                _RoleCard(
                  title: 'Both (Owner & Driver)',
                  badge: 'Dual Role',
                  description: 'Hire chauffeurs for your car and take incoming driving dispatches with seamless role switching.',
                  icon: SafarIconType.shieldCheck,
                  isSelected: _selectedRole == UserRole.both,
                  onTap: () => _onRoleTapped(UserRole.both),
                ),
              ] else if (_step == 1) ...[
                Text('Phone Verification', style: theme.textTheme.bodySmall?.copyWith(fontFamily: 'IBM Plex Mono')),
                const SizedBox(height: 4),
                Text('Enter mobile number', style: theme.textTheme.displayMedium),
                const SizedBox(height: 8),
                Text(
                  'We will send an SMS code to verify your phone number.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: SafarColors.mutedText),
                ),
                const SizedBox(height: SafarSpacing.s24),

                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                  ),
                ),
                const SizedBox(height: SafarSpacing.s16),

                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    prefixText: '+91 ',
                    labelText: 'Mobile Number',
                  ),
                ),
                const SizedBox(height: SafarSpacing.s24),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SafarColors.ink,
                      foregroundColor: SafarColors.surface,
                      shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                    ),
                    onPressed: () => setState(() => _step = 2),
                    child: const Text('Send 4-Digit OTP', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ] else ...[
                Text('Security Token', style: theme.textTheme.bodySmall?.copyWith(fontFamily: 'IBM Plex Mono')),
                const SizedBox(height: 4),
                Text('Enter 4-digit OTP', style: theme.textTheme.displayMedium),
                const SizedBox(height: 8),
                Text(
                  'Sent to +91 ${_phoneController.text}. Demo test code: 4829',
                  style: theme.textTheme.bodyMedium?.copyWith(color: SafarColors.mutedText),
                ),
                const SizedBox(height: SafarSpacing.s24),

                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 12,
                  ),
                  decoration: InputDecoration(
                    errorText: _errorMessage,
                    counterText: '',
                  ),
                ),
                const SizedBox(height: SafarSpacing.s24),

                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: SafarColors.ink,
                      foregroundColor: SafarColors.surface,
                      shape: const RoundedRectangleBorder(borderRadius: SafarRadii.button),
                    ),
                    onPressed: _verifyOtp,
                    child: const Text('Verify & Enter Safar', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String title;
  final String badge;
  final String description;
  final SafarIconType icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _RoleCard({
    required this.title,
    required this.badge,
    required this.description,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: SafarRadii.card,
      child: Container(
        padding: const EdgeInsets.all(SafarSpacing.s16),
        decoration: BoxDecoration(
          color: SafarColors.surface,
          borderRadius: SafarRadii.card,
          border: Border.all(
            color: isSelected ? SafarColors.ink : SafarColors.rule,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: SafarColors.paper,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: SafarColors.rule),
              ),
              child: Center(child: SafarIcon(icon, size: 20)),
            ),
            const SizedBox(width: SafarSpacing.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: SafarColors.paper,
                          borderRadius: BorderRadius.circular(3),
                          border: Border.all(color: SafarColors.rule),
                        ),
                        child: Text(
                          badge,
                          style: const TextStyle(
                            fontFamily: 'IBM Plex Mono',
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(color: SafarColors.mutedText, fontSize: 12, height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
