import { describe, it, expect } from 'vitest';
import { formService } from '../../src/services/formService';

describe('Google Forms URL Validation', () => {
  it('accepts standard Google Forms docs.google.com URLs', () => {
    const validUrl1 = 'https://docs.google.com/forms/d/e/1FAIpQLSc_ExampleFormId/viewform';
    const validUrl2 = 'https://docs.google.com/forms/d/12345/edit';
    expect(formService.isValidGoogleFormsUrl(validUrl1)).toBe(true);
    expect(formService.isValidGoogleFormsUrl(validUrl2)).toBe(true);
  });

  it('accepts shortened forms.gle URLs', () => {
    const validUrl = 'https://forms.gle/xYz123AbC';
    expect(formService.isValidGoogleFormsUrl(validUrl)).toBe(true);
  });

  it('rejects arbitrary external URLs', () => {
    expect(formService.isValidGoogleFormsUrl('https://malicious-phishing.com/login')).toBe(false);
    expect(formService.isValidGoogleFormsUrl('http://docs.google.com/forms/insecure')).toBe(false); // Non-HTTPS
    expect(formService.isValidGoogleFormsUrl('https://example.com/forms')).toBe(false);
    expect(formService.isValidGoogleFormsUrl('javascript:alert(1)')).toBe(false);
  });
});
