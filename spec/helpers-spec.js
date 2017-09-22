'use babel';

import * as helpers from '../lib/helpers';

describe('The helpers module', () => {
  describe('messagePath', () => {
    it('works with v1 and diagnostics-store messages', () => {
      const message = { filePath: 'foo' };
      const parsed = helpers.messagePath(message);
      expect(parsed).toBe(message.filePath);
    });

    it('works with v2 messages', () => {
      const message = { location: { file: 'foo' } };
      const parsed = helpers.messagePath(message);
      expect(parsed).toBe(message.location.file);
    });

    it('handles invalid v2 messages', () => {
      const message = { location: {} };
      const parsed = helpers.messagePath(message);
      expect(parsed).toBe(null);
    });

    it('handles invalid v1/diagnostics-store messages', () => {
      const message = {};
      const parsed = helpers.messagePath(message);
      expect(parsed).toBe(null);
    });
  });

  describe('messageRange', () => {
    it('works with v1 and diagnostics-store messages', () => {
      const message = { range: [[0, 0], [0, 1]] };
      const parsed = helpers.messageRange(message);
      expect(parsed).toBe(message.range);
    });

    it('works with v2 messages', () => {
      const message = { location: { position: [[0, 0], [0, 1]] } };
      const parsed = helpers.messageRange(message);
      expect(parsed).toBe(message.location.position);
    });

    it('handles invalid v2 messages', () => {
      const message = { location: {} };
      const parsed = helpers.messageRange(message);
      expect(parsed).toBe(null);
    });

    it('handles invalid v1/diagnostics-store messages', () => {
      const message = {};
      const parsed = helpers.messageRange(message);
      expect(parsed).toBe(null);
    });
  });

  describe('messageSeverity', () => {
    describe('and v1 and diagnostics-store messages', () => {
      it('correctly pulls the severity out', () => {
        const message = { type: 'error' };
        const parsed = helpers.messageSeverity(message);
        expect(parsed).toBe(message.type);
      });

      it('handles all cases', () => {
        const message = { type: 'Error' };
        const parsed = helpers.messageSeverity(message);
        expect(parsed).toBe(message.type.toLowerCase());
      });

      it("changes Types that don't map to severities to 'error'", () => {
        const message = { type: 'foobar' };
        const parsed = helpers.messageSeverity(message);
        expect(parsed).toBe('error');
      });

      it('handles invalid messages', () => {
        const message = {};
        const parsed = helpers.messageSeverity(message);
        expect(parsed).toBe('error');
      });
    });

    describe('and v2 messages', () => {
      it('correctly pulls the severity out', () => {
        const message = { severity: 'error' };
        const parsed = helpers.messageSeverity(message);
        expect(parsed).toBe(message.severity);
      });

      it('handles invalid messages', () => {
        const message = {};
        const parsed = helpers.messageSeverity(message);
        expect(parsed).toBe('error');
      });
    });
  });

  describe('goodMessage', () => {
    it('returns false for messages with no path', () => {
      const message = {};
      const isGood = helpers.goodMessage(message, 'foobar');
      expect(isGood).toBe(false);
    });

    it('returns false for messages with no range', () => {
      const filePath = 'foobar';
      const message = { filePath };
      const isGood = helpers.goodMessage(message, filePath);
      expect(isGood).toBe(false);
    });

    it('returns false for messages with the wrong path', () => {
      const message = { filePath: 'barfoo', range: [[0, 0], [0, 1]] };
      const isGood = helpers.goodMessage(message, 'foobar');
      expect(isGood).toBe(false);
    });

    it('returns false for messages with the right path but no range', () => {
      const filePath = 'foobar';
      const message = { filePath };
      const isGood = helpers.goodMessage(message, filePath);
      expect(isGood).toBe(false);
    });

    it('returns true for messages with the right path and a range', () => {
      const filePath = 'foobar';
      const message = { filePath, range: [[0, 0], [0, 1]] };
      const isGood = helpers.goodMessage(message, filePath);
      expect(isGood).toBe(true);
    });
  });
});
