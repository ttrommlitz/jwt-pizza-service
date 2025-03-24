const { request } = require('express');
const config = require('./config');
const os = require('os');

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

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function incrementPizzasSold() {
  metrics.pizzas.sold += 1;
}

function incrementPizzaCreationFailures() {
  metrics.pizzas.creationFailures += 1;
}

function increasePizzaRevenue(amount) {
  metrics.pizzas.revenue += amount;
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

  sendMetricToGrafana('cpu_usage', getCpuUsagePercentage(), { type: 'cpu_usage' });

  sendMetricToGrafana('memory_usage', getMemoryUsagePercentage(), { type: 'memory_usage' });

  console.log("PIZZAS SOLD", metrics.pizzas)
  sendMetricToGrafana('pizzas_sold', metrics.pizzas.sold)

  sendMetricToGrafana('pizza_creation_failures', metrics.pizzas.creationFailures)

  sendMetricToGrafana('pizza_revenue', metrics.pizzas.revenue)


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
                      asDouble: metricValue,
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
  incrementAuthAttempts,
  incrementPizzasSold,
  incrementPizzaCreationFailures,
  increasePizzaRevenue
};