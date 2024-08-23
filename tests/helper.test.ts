import { convertToMs, nextTime, prevTime } from "../src/utils/helper";


describe('Time Utility Functions', () => {
  describe('convertToMs', () => {
    it('should convert minutes to milliseconds', () => {
      expect(convertToMs(5, 'min')).toBe(300000);
      expect(convertToMs(1, 'min')).toBe(60000);
      expect(convertToMs(0, 'min')).toBe(0);
    });

    it('should convert hours to milliseconds', () => {
      expect(convertToMs(1, 'hour')).toBe(3600000);
      expect(convertToMs(2, 'hour')).toBe(7200000);
      expect(convertToMs(0, 'hour')).toBe(0);
    });

    it('should return default value for invalid unit', () => {
      expect(convertToMs(5, 'invalid' as any)).toBe(3600000);
    });
  });

  describe('prevTime', () => {
    it('should return a date in the past', () => {
      const now = new Date();
      const result = prevTime(30);
      expect(result.getTime()).toBeLessThan(now.getTime());
      expect(now.getTime() - result.getTime()).toBeCloseTo(30 * 60000, -2);
    });

    it('should handle zero minutes', () => {
      const now = new Date();
      const result = prevTime(0);
      expect(result.getTime()).toBeCloseTo(now.getTime(), -2);
    });
  });

  describe('nextTime', () => {
    it('should return a date in the future', () => {
      const now = new Date();
      const result = nextTime(30);
      expect(result.getTime()).toBeGreaterThan(now.getTime());
      expect(result.getTime() - now.getTime()).toBeCloseTo(30 * 60000, -2);
    });

    it('should handle zero minutes', () => {
      const now = new Date();
      const result = nextTime(0);
      expect(result.getTime()).toBeCloseTo(now.getTime(), -2);
    });
  });
});