export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong";
}

const rules = [
  {
    test: (pw: string) => pw.length >= 8,
    message: "At least 8 characters",
  },
  {
    test: (pw: string) => /[A-Z]/.test(pw),
    message: "At least one uppercase letter",
  },
  {
    test: (pw: string) => /[a-z]/.test(pw),
    message: "At least one lowercase letter",
  },
  {
    test: (pw: string) => /\d/.test(pw),
    message: "At least one number",
  },
];

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let passedCount = 0;

  for (const rule of rules) {
    if (rule.test(password)) {
      passedCount++;
    } else {
      errors.push(rule.message);
    }
  }

  let strength: "weak" | "fair" | "strong";
  if (passedCount <= 2) {
    strength = "weak";
  } else if (passedCount === 3) {
    strength = "fair";
  } else {
    strength = "strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export const passwordRules = rules.map((r) => r.message);
