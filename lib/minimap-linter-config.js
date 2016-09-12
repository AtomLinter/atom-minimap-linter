'use babel';

export default {
  markerType: {
    type: 'string',
    default: 'line',
    enum: ['line', 'gutter', 'highlight-under', 'highlight-over', 'highlight-outline'],
    description: 'Marker type for linter highlights'
  }
};
