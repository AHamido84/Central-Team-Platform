import { describe, expect, it } from "vitest";
import { validateFieldValues, isFieldVisible, visibleValuesOnly, type FieldDef } from "./dynamic-field-validation";

const textField: FieldDef = { key: "title", type: "TEXT", required: true };
const numberField: FieldDef = { key: "qty", type: "NUMBER", required: false, minValue: 1, maxValue: 10 };
const selectField: FieldDef = {
  key: "platform",
  type: "SELECT",
  required: true,
  options: [
    { value: "instagram", isActive: true },
    { value: "old_platform", isActive: false },
  ],
};
const conditionalField: FieldDef = {
  key: "voiceLanguage",
  type: "TEXT",
  required: true,
  visibleIfFieldKey: "needsVoiceOver",
  visibleIfValue: "yes",
};

describe("validateFieldValues", () => {
  it("flags a missing required field", () => {
    const errors = validateFieldValues([textField], {});
    expect(errors.title).toBe("required");
  });

  it("passes when a required field is filled", () => {
    const errors = validateFieldValues([textField], { title: "Banner" });
    expect(errors.title).toBeUndefined();
  });

  it("enforces min/max on numeric fields", () => {
    expect(validateFieldValues([numberField], { qty: 0 }).qty).toBe("minValue");
    expect(validateFieldValues([numberField], { qty: 11 }).qty).toBe("maxValue");
    expect(validateFieldValues([numberField], { qty: 5 }).qty).toBeUndefined();
  });

  it("rejects a value that isn't one of the active options", () => {
    expect(validateFieldValues([selectField], { platform: "tiktok" }).platform).toBe("invalidOption");
    expect(validateFieldValues([selectField], { platform: "old_platform" }).platform).toBe("invalidOption");
    expect(validateFieldValues([selectField], { platform: "instagram" }).platform).toBeUndefined();
  });

  it("skips a required field entirely while its condition is unmet", () => {
    const errors = validateFieldValues([conditionalField], { needsVoiceOver: "no" });
    expect(errors.voiceLanguage).toBeUndefined();
  });

  it("validates a conditional field once its condition is met", () => {
    const errors = validateFieldValues([conditionalField], { needsVoiceOver: "yes" });
    expect(errors.voiceLanguage).toBe("required");
  });
});

describe("isFieldVisible", () => {
  it("is always visible with no condition", () => {
    expect(isFieldVisible(textField, {})).toBe(true);
  });

  it("respects the visibleIf condition", () => {
    expect(isFieldVisible(conditionalField, { needsVoiceOver: "yes" })).toBe(true);
    expect(isFieldVisible(conditionalField, { needsVoiceOver: "no" })).toBe(false);
    expect(isFieldVisible(conditionalField, {})).toBe(false);
  });
});

describe("visibleValuesOnly", () => {
  it("drops values for hidden fields", () => {
    const result = visibleValuesOnly([conditionalField], {
      needsVoiceOver: "no",
      voiceLanguage: "Arabic",
    });
    expect(result.voiceLanguage).toBeUndefined();
  });

  it("keeps values for visible fields", () => {
    const result = visibleValuesOnly([conditionalField], {
      needsVoiceOver: "yes",
      voiceLanguage: "Arabic",
    });
    expect(result.voiceLanguage).toBe("Arabic");
  });
});
