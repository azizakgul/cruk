const {validateEmail, validateDonationAmount} = require('./app');

test('validate email', () => {
  expect(validateEmail("hello@ok.com")).toBe(true);
});

test('validate donation', () => {
    expect(validateDonationAmount(100)).toBe(true);
});