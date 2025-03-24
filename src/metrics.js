const { request } = require('express');
const config = require('./config');

const metrics = {
  requestsByMethod: {
    GET: 0,
    POST: 0,
    PUT: 0,
    DELETE: 0
  },
  activeUsers: 0,
  authAttempts: {
    success: 0,
    failure: 0
  },
  system: {
    memoryPercentage: 0,
    cpuPercentage: 0
  },
  pizzas: {
    sold: 0,
    creationFailures: 0,
    revenue: 0
  },
  latency: {
    endpointLatency: 0,
    pizzaCreationLatency: 0
  }
}

// helpers
function incrementActiveUsers() {
  metrics.activeUsers += 1;
}

function decrementActiveUsers() {
  metrics.activeUsers -= 1;
}

function requestTracker() {
  return (req, res, next) => {
    metrics.requestsByMethod[req.method] += 1
    next()
  }
}

function incrementAuthAttempts(success) {
  if (success) {
    metrics.authAttempts.success += 1;
  } else {
    metrics.authAttempts.failure += 1;
  }
}

// This will periodically send metrics to Grafana
const timer = setInterval(() => {
  Object.keys(metrics.requestsByMethod).forEach((method) => {
    sendMetricToGrafana('methods', metrics.requestsByMethod[method], { method });
  });
  
  // Send active users metric
  sendMetricToGrafana('active_users', metrics.activeUsers, { type: 'concurrent_users' });

  Object.keys(metrics.authAttempts).forEach((attempt) => {
    sendMetricToGrafana('auth_attempts', metrics.authAttempts[attempt], { type: attempt });
  });
}, 10000);

function sendMetricToGrafana(metricName, metricValue, attributes) {
  attributes = { ...attributes, source: config.source };

  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: '1',
                sum: {
                  dataPoints: [
                    {
                      asInt: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                      attributes: [],
                    },
                  ],
                  aggregationTemporality: 'AGGREGATION_TEMPORALITY_CUMULATIVE',
                  isMonotonic: true,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  Object.keys(attributes).forEach((key) => {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0].sum.dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  fetch(`${config.metrics.url}`, {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { Authorization: `Bearer ${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Failed to push metrics data to Grafana');
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

module.exports = { 
  requestTracker,
  incrementActiveUsers,
  decrementActiveUsers,
  incrementAuthAttempts
};