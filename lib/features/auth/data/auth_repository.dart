import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../domain/user_entity.dart';

abstract class AuthRepository {
  Stream<UserEntity?> authStateChanges();
  Future<void> sendPhoneOtp({
    required String phoneNumber,
    required Function(String verificationId) onCodeSent,
    required Function(FirebaseAuthException error) onFailed,
  });
  Future<UserEntity> verifyOtpAndSignIn({
    required String verificationId,
    required String smsCode,
    required String name,
    required UserRole role,
  });
  Future<void> switchRole(String uid, UserRole newRole);
  Future<void> signOut();
}

class FirebaseAuthRepository implements AuthRepository {
  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  FirebaseAuthRepository({
    FirebaseAuth? auth,
    FirebaseFirestore? firestore,
  })  : _auth = auth ?? FirebaseAuth.instance,
        _firestore = firestore ?? FirebaseFirestore.instance;

  @override
  Stream<UserEntity?> authStateChanges() {
    return _auth.authStateChanges().asyncMap((user) async {
      if (user == null) return null;
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (!doc.exists) return null;
      return UserEntity.fromJson(doc.data()!);
    });
  }

  @override
  Future<void> sendPhoneOtp({
    required String phoneNumber,
    required Function(String verificationId) onCodeSent,
    required Function(FirebaseAuthException error) onFailed,
  }) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (PhoneAuthCredential credential) async {
        await _auth.signInWithCredential(credential);
      },
      verificationFailed: onFailed,
      codeSent: (String verificationId, int? resendToken) {
        onCodeSent(verificationId);
      },
      codeAutoRetrievalTimeout: (String verificationId) {},
    );
  }

  @override
  Future<UserEntity> verifyOtpAndSignIn({
    required String verificationId,
    required String smsCode,
    required String name,
    required UserRole role,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    final userCredential = await _auth.signInWithCredential(credential);
    final user = userCredential.user!;

    final userDoc = await _firestore.collection('users').doc(user.uid).get();

    if (userDoc.exists) {
      return UserEntity.fromJson(userDoc.data()!);
    }

    final newUser = UserEntity(
      uid: user.uid,
      name: name,
      phone: user.phoneNumber ?? '',
      role: role,
      activeRole: role == UserRole.both ? UserRole.owner : role,
      createdAt: DateTime.now(),
    );

    await _firestore.collection('users').doc(user.uid).set(newUser.toJson());
    return newUser;
  }

  @override
  Future<void> switchRole(String uid, UserRole newRole) async {
    await _firestore.collection('users').doc(uid).update({
      'activeRole': newRole.name,
    });
  }

  @override
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
