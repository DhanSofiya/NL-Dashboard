document.addEventListener("DOMContentLoaded", async () => {
  try {
    await fetch("/components/sidebar.html")
      .then(res => res.text())
      .then(html => {
        document.getElementById("sidebar").innerHTML = html;

        fetch('/api/session-role')
          .then(res => res.json())
          .then(data => {
            if (data.role === 'Staff') {
              const financeItem = document.querySelector("#financeLink");
              const usersItem = document.querySelector("#usersLink");
              if (financeItem) financeItem.style.display = "none";
              if (usersItem) usersItem.style.display = "none";
            }
          })
          .catch(err => console.error("Role fetch error:", err));
      });
  } catch (err) {
    console.error("Sidebar loading error:", err);
  }

  function limitData(data, limit) {
    if (limit === 'All') return data;
    return data.slice(0, parseInt(limit));
  }

  async function renderChart(endpoint, elementId, labelKey, valueKey, type, limitKey, limit = '5', hideLegend = false) {
    try {
      const res = await fetch(endpoint);
      const data = await res.json();

      const limited = limitData(data.sort((a, b) => b[valueKey] - a[valueKey]), limit);

      const canvas = document.getElementById(elementId);
      if (!canvas) {
        console.error(`❌ Canvas with ID '${elementId}' not found.`);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error(`❌ Failed to get context for canvas ID: ${elementId}`);
        return;
      }

      if (window[elementId + "Chart"] instanceof Chart) {
        window[elementId + "Chart"].destroy();
      }

      const dataset = {
        data: limited.map(d => d[valueKey]),
        backgroundColor: [
          '#f39c12', '#1abc9c', '#9b59b6', '#f1c40f', '#e74c3c',
          '#3498db', '#e67e22', '#2ecc71', '#34495e', '#c0392b'
        ]
      };
      if (!hideLegend) dataset.label = valueKey;

      window[elementId + "Chart"] = new Chart(ctx, {
        type: type,
        data: {
          labels: limited.map(d => d[labelKey]),
          datasets: [dataset]
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: !hideLegend
            }
          },
          ...(type !== 'doughnut' && {
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  stepSize: 50
                },
                grid: {
                  drawTicks: true,
                  drawBorder: false
                }
              },
              x: {
                grid: {
                  drawTicks: false,
                  drawBorder: false
                }
              }
            }
          })
        }
      });
    } catch (err) {
      console.error(`❌ Error rendering chart for ${elementId}:`, err);
    }
  }

  async function renderCombinedChart() {
    try {
      const [dailyRes, revenueRes] = await Promise.all([
        fetch('/api/finance/expenses/daily'),
        fetch('/api/finance/revenue/daily')
      ]);

      const dailyData = await dailyRes.json();
      const revenueData = await revenueRes.json();

      const expenseMap = Object.fromEntries(dailyData.map(d => [d.date, d.total]));
      const revenueMap = Object.fromEntries(revenueData.map(d => [d.date, d.revenue]));

      const allDates = Array.from(new Set([...Object.keys(expenseMap), ...Object.keys(revenueMap)])).sort();
      const expenses = allDates.map(date => expenseMap[date] || 0);
      const revenues = allDates.map(date => revenueMap[date] || 0);

      const ctx = document.getElementById("combinedChart").getContext("2d");
      if (window.combinedChart instanceof Chart) window.combinedChart.destroy();

      window.combinedChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allDates,
          datasets: [
            { label: "Total Revenue (MYR)", data: revenues, borderColor: '#27ae60', fill: false },
            { label: "Total Expenses (MYR)", data: expenses, borderColor: '#e74c3c', fill: false }
          ]
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                drawTicks: true,
                drawBorder: false
              }
            },
            x: {
              grid: {
                drawTicks: false,
                drawBorder: false
              }
            }
          }
        }
      });
    } catch (err) {
      console.error("❌ Error in renderCombinedChart:", err);
    }
  }

  async function renderSalaryChart() {
    try {
      const [staffRes, revenueRes] = await Promise.all([
        fetch('/api/finance/users/staff-count'),
        fetch('/api/finance/revenue/customers')
      ]);

      const staffData = await staffRes.json();
      const revenueData = await revenueRes.json();

      const staffCount = staffData.count || 0;
      const staffSalary = staffCount * 20;
      const riderCommission = revenueData.totalRiderCommission || 0;

      const ctx = document.getElementById("salaryChart").getContext("2d");
      if (window.salaryChart instanceof Chart) {
        window.salaryChart.destroy();
      }

      window.salaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Staff Salary', 'Rider Commission'],
          datasets: [{
            data: [staffSalary, riderCommission],
            backgroundColor: ['#3498db', '#e67e22']
          }]
        },
        options: {
          indexAxis: 'y',
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                drawTicks: false,
                drawBorder: false
              }
            },
            y: {
              grid: {
                drawTicks: true,
                drawBorder: false
              }
            }
          }
        }
      });
    } catch (err) {
      console.error("❌ Error rendering salary chart:", err);
    }
  }

  try {
    document.getElementById("salesLimit").addEventListener("change", e =>
      renderChart("/api/finance/revenue/products", "salesChart", "name", "quantity", "doughnut", "salesLimit", e.target.value)
    );
    document.getElementById("productLimit").addEventListener("change", e =>
      renderChart("/api/finance/expenses/products", "productChart", "name", "totalExpense", "doughnut", "productLimit", e.target.value)
    );
    document.getElementById("supplierLimit").addEventListener("change", e =>
      renderChart("/api/finance/expenses/suppliers", "supplierChart", "name", "totalExpense", "bar", "supplierLimit", e.target.value, true)
    );
  } catch (err) {
    console.error("❌ Error attaching event listeners:", err);
  }

  try {
    document.getElementById("downloadPDF").addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      await html2canvas(document.getElementById("financeGrid")).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save("Finance_Dashboard.pdf");
      });
    });
  } catch (err) {
    console.error("❌ Error in PDF export:", err);
  }

  // Initial Renders
  renderChart("/api/finance/revenue/products", "salesChart", "name", "quantity", "doughnut", "salesLimit");
  renderChart("/api/finance/expenses/products", "productChart", "name", "totalExpense", "doughnut", "productLimit");
  renderChart("/api/finance/expenses/suppliers", "supplierChart", "name", "totalExpense", "bar", "supplierLimit", true);
  renderCombinedChart();
  renderSalaryChart();

  setTimeout(() => {
    Chart.helpers.each(Chart.instances, function(chart) {
      if (chart) chart.resize();
    });
  }, 300);
});