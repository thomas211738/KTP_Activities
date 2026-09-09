import React from 'react';
import { Redirect } from 'expo-router';

// Old signup links re-enter the shared account creation flow.
export default function Signup() { return <Redirect href="/" />; }
