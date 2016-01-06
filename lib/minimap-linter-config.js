'use babel';

export default {
  markerType: {
    type: 'string',
    default: 'line',
    enum: ['line', 'highlight-under', 'highlight-over', 'highlight-outline'],
    description: 'Marker type'
  }
};
