const { getUserAnalytics, getAdminGrowthReport, buildAdminEmailReport } = require('../utils/analytics');
const { createSimplePdf } = require('../utils/reportPdf');

exports.getMyAnalytics = async (req, res) => {
  try {
    const analytics = await getUserAnalytics(req.user._id);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminReport = async (req, res) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
    const report = await getAdminGrowthReport(period);
    const email = buildAdminEmailReport(report);
    res.json({ ...report, email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminReportEmail = async (req, res) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
    const report = await getAdminGrowthReport(period);
    res.json(buildAdminEmailReport(report));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.downloadAdminReportPdf = async (req, res) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
    const report = await getAdminGrowthReport(period);

    const pdf = createSimplePdf(
      `${period === 'monthly' ? 'Monthly' : 'Weekly'} Adopt A Book Admin Report`,
      [
        {
          heading: 'Reporting window',
          lines: [
            `Current period: ${report.range.currentLabel}`,
            `Previous period: ${report.range.previousLabel}`,
          ],
        },
        {
          heading: 'Growth summary',
          lines: [
            `New users: ${report.metrics.newUsers.current} (${report.metrics.newUsers.delta >= 0 ? '+' : ''}${report.metrics.newUsers.delta} vs previous period)`,
            `New books: ${report.metrics.newBooks.current} (${report.metrics.newBooks.delta >= 0 ? '+' : ''}${report.metrics.newBooks.delta} vs previous period)`,
            `New requests: ${report.metrics.newRequests.current} (${report.metrics.newRequests.delta >= 0 ? '+' : ''}${report.metrics.newRequests.delta} vs previous period)`,
            `Completed donations: ${report.metrics.completedDonations.current} (${report.metrics.completedDonations.delta >= 0 ? '+' : ''}${report.metrics.completedDonations.delta} vs previous period)`,
            `Reviews: ${report.metrics.reviews.current}`,
            `Messages: ${report.metrics.messages.current}`,
          ],
        },
        {
          heading: 'Top listing categories',
          lines: report.highlights.topListingCategories.length > 0
            ? report.highlights.topListingCategories.map((item) => `${item.label}: ${item.count}`)
            : ['No new listings in this period.'],
        },
        {
          heading: 'Top impact cities',
          lines: report.highlights.topImpactCities.length > 0
            ? report.highlights.topImpactCities.map((item) => `${item.label}: ${item.count} completed deliveries`)
            : ['No completed deliveries in this period.'],
        },
        {
          heading: 'Trend snapshots',
          lines: [
            `Users trend: ${report.trends.users.map((item) => `${item.label} ${item.count}`).join(' | ')}`,
            `Books trend: ${report.trends.books.map((item) => `${item.label} ${item.count}`).join(' | ')}`,
            `Requests trend: ${report.trends.requests.map((item) => `${item.label} ${item.count}`).join(' | ')}`,
            `Donations trend: ${report.trends.donations.map((item) => `${item.label} ${item.count}`).join(' | ')}`,
            `Reviews trend: ${report.trends.reviews.map((item) => `${item.label} ${item.count}`).join(' | ')}`,
          ],
        },
      ],
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="adopt-a-book-${period}-report.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
