// Expo's own types, including its react-native-web style additions (e.g. position: 'sticky' on web).
// expo-env.d.ts loads these too, but Expo generates that file locally and it is git-ignored, so CI
// typechecks without it. Referencing them from a tracked file keeps CI and local typechecks the same.
/// <reference types="expo/types" />
