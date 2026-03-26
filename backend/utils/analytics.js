const User = require('../models/User');
const Book = require('../models/Book');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const Review = require('../models/Review');
const Message = require('../models/Message');

const COMPLETED_DONATION_STATUSES = ['delivered', 'confirmed'];

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const addDays = (date, days) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const startOfYear = (date = new Date()) => new Date(date.getFullYear(), 0, 1);
const startOfMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1);

const getDonationEventDate = (donation) => donation.confirmedAt || donation.deliveredAt || donation.donationDate || donation.createdAt;

const roundTo = (value, precision = 1) => {
  if (!Number.isFinite(Number(value))) return 0;
  const factor = 10 ** precision;
  return Math.round(Number(value) * factor) / factor;
};

const sanitizeLocation = (location) => {
  if (!location) return '';
  return String(location).split(',')[0].trim();
};

const groupCounts = (items, getter) => {
  const map = new Map();
  for (const item of items) {
    const rawKey = getter(item);
    const key = rawKey ? String(rawKey).trim() : 'Unknown';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

const buildMonthlySeries = (items, getDate) => {
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }).map((_, index) => ({
    key: index,
    label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(currentYear, index, 1)),
    count: 0,
  }));

  for (const item of items) {
    const date = getDate(item);
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) continue;
    if (date.getFullYear() !== currentYear) continue;
    months[date.getMonth()].count += 1;
  }

  return months;
};

const buildTrendBuckets = (period = 'weekly') => {
  const now = new Date();

  if (period === 'monthly') {
    const buckets = [];
    for (let index = 4; index >= 0; index -= 1) {
      const start = startOfDay(addDays(now, -(index * 7 + 6)));
      const end = endOfDay(addDays(now, -index * 7));
      buckets.push({
        label: `${start.toLocaleString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}`,
        start,
        end,
      });
    }
    return buckets;
  }

  return Array.from({ length: 7 }).map((_, index) => {
    const date = startOfDay(addDays(now, -(6 - index)));
    return {
      label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      start: date,
      end: endOfDay(date),
    };
  });
};

const buildSeriesFromDocs = (docs, buckets, getDate) => buckets.map((bucket) => ({
  label: bucket.label,
  count: docs.filter((doc) => {
    const date = getDate(doc);
    return date && date >= bucket.start && date <= bucket.end;
  }).length,
}));

const formatRangeLabel = (start, end) => `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

const getReportWindow = (period = 'weekly') => {
  const now = new Date();
  const days = period === 'monthly' ? 30 : 7;
  const currentEnd = endOfDay(now);
  const currentStart = startOfDay(addDays(currentEnd, -(days - 1)));
  const previousEnd = endOfDay(addDays(currentStart, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)));

  return {
    period,
    days,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    currentLabel: formatRangeLabel(currentStart, currentEnd),
    previousLabel: formatRangeLabel(previousStart, previousEnd),
  };
};

const pickFavourite = (items, emptyLabel = 'No data yet') => items[0]?.label || emptyLabel;

async function getUserAnalytics(userId) {
  const [receivedDonations, givenDonations] = await Promise.all([
    Donation.find({ receiverId: userId, status: { $in: COMPLETED_DONATION_STATUSES } })
      .populate('bookId', 'title author category createdAt')
      .populate('donorId', 'name location')
      .sort({ createdAt: -1 }),
    Donation.find({ donorId: userId, status: { $in: COMPLETED_DONATION_STATUSES } })
      .populate('bookId', 'title author category createdAt')
      .populate('receiverId', 'name location')
      .sort({ createdAt: -1 }),
  ]);

  const now = new Date();
  const currentYearStart = startOfYear(now);
  const currentMonthStart = startOfMonth(now);

  const adoptedThisYear = receivedDonations.filter((donation) => getDonationEventDate(donation) >= currentYearStart);
  const adoptedThisMonth = receivedDonations.filter((donation) => getDonationEventDate(donation) >= currentMonthStart);
  const readingCategories = groupCounts(receivedDonations, (donation) => donation.bookId?.category);
  const favouriteCategory = pickFavourite(readingCategories, 'Still exploring');
  const adoptedAuthors = groupCounts(receivedDonations, (donation) => donation.bookId?.author).slice(0, 5);

  const studentReadingAnalytics = {
    totalAdoptedBooks: receivedDonations.length,
    adoptedThisYear: adoptedThisYear.length,
    adoptedThisMonth: adoptedThisMonth.length,
    favouriteCategory,
    categoryBreakdown: readingCategories,
    topAuthors: adoptedAuthors,
    monthlyTrend: buildMonthlySeries(receivedDonations, getDonationEventDate),
    recentBooks: receivedDonations.slice(0, 5).map((donation) => ({
      donationId: donation._id,
      title: donation.bookId?.title || 'Unknown book',
      author: donation.bookId?.author || 'Unknown author',
      category: donation.bookId?.category || 'Other',
      adoptedAt: getDonationEventDate(donation),
      donorName: donation.donorId?.name || 'Unknown donor',
      donorLocation: donation.donorId?.location || '',
    })),
  };

  const recipientCities = groupCounts(givenDonations, (donation) => sanitizeLocation(donation.receiverId?.location)).filter((entry) => entry.label !== 'Unknown');
  const impactedStudents = new Set(givenDonations.map((donation) => String(donation.receiverId?._id || ''))).size;
  const uniqueCities = new Set(recipientCities.map((entry) => entry.label)).size;
  const donorCategories = groupCounts(givenDonations, (donation) => donation.bookId?.category);

  const donorImpactAnalytics = {
    totalBooksShared: givenDonations.length,
    studentsReached: impactedStudents,
    citiesReached: uniqueCities,
    favouriteSharedCategory: pickFavourite(donorCategories, 'No completed shares yet'),
    cityBreakdown: recipientCities,
    categoryBreakdown: donorCategories,
    monthlyTrend: buildMonthlySeries(givenDonations, getDonationEventDate),
    impactMap: recipientCities.map((entry) => ({
      city: entry.label,
      count: entry.count,
    })),
    recentRecipients: givenDonations.slice(0, 6).map((donation) => ({
      donationId: donation._id,
      recipientName: donation.receiverId?.name || 'Unknown student',
      city: sanitizeLocation(donation.receiverId?.location) || 'Unknown',
      title: donation.bookId?.title || 'Unknown book',
      category: donation.bookId?.category || 'Other',
      deliveredAt: getDonationEventDate(donation),
    })),
  };

  return {
    studentReadingAnalytics,
    donorImpactAnalytics,
  };
}

function buildGrowthMetric(current, previous) {
  const delta = current - previous;
  const deltaPercentage = previous > 0 ? roundTo((delta / previous) * 100, 1) : current > 0 ? 100 : 0;
  return { current, previous, delta, deltaPercentage };
}

async function getAdminGrowthReport(period = 'weekly') {
  const window = getReportWindow(period);
  const trendBuckets = buildTrendBuckets(period);
  const fetchSince = window.previousStart;

  const [users, books, requests, donations, reviews, messages] = await Promise.all([
    User.find({ createdAt: { $gte: fetchSince } }).select('createdAt role location name'),
    Book.find({ createdAt: { $gte: fetchSince } }).select('createdAt category donorId title'),
    Request.find({ createdAt: { $gte: fetchSince } }).select('createdAt status donorId requesterId'),
    Donation.find({ createdAt: { $gte: fetchSince } })
      .select('createdAt donationDate deliveredAt confirmedAt status donorId receiverId')
      .populate('receiverId', 'location name')
      .populate('donorId', 'name'),
    Review.find({ createdAt: { $gte: fetchSince } }).select('createdAt reviewType bookId'),
    Message.find({ createdAt: { $gte: fetchSince } }).select('createdAt conversationId'),
  ]);

  const inRange = (date, start, end) => date && date >= start && date <= end;
  const currentCompletedDonations = donations.filter((donation) => inRange(getDonationEventDate(donation), window.currentStart, window.currentEnd) && COMPLETED_DONATION_STATUSES.includes(donation.status));
  const previousCompletedDonations = donations.filter((donation) => inRange(getDonationEventDate(donation), window.previousStart, window.previousEnd) && COMPLETED_DONATION_STATUSES.includes(donation.status));

  const report = {
    period,
    range: {
      currentLabel: window.currentLabel,
      previousLabel: window.previousLabel,
      currentStart: window.currentStart,
      currentEnd: window.currentEnd,
      previousStart: window.previousStart,
      previousEnd: window.previousEnd,
    },
    totals: {
      users: await User.countDocuments(),
      books: await Book.countDocuments(),
      requests: await Request.countDocuments(),
      donations: await Donation.countDocuments(),
      reviews: await Review.countDocuments(),
      messages: await Message.countDocuments(),
    },
    metrics: {
      newUsers: buildGrowthMetric(
        users.filter((item) => inRange(item.createdAt, window.currentStart, window.currentEnd)).length,
        users.filter((item) => inRange(item.createdAt, window.previousStart, window.previousEnd)).length,
      ),
      newBooks: buildGrowthMetric(
        books.filter((item) => inRange(item.createdAt, window.currentStart, window.currentEnd)).length,
        books.filter((item) => inRange(item.createdAt, window.previousStart, window.previousEnd)).length,
      ),
      newRequests: buildGrowthMetric(
        requests.filter((item) => inRange(item.createdAt, window.currentStart, window.currentEnd)).length,
        requests.filter((item) => inRange(item.createdAt, window.previousStart, window.previousEnd)).length,
      ),
      completedDonations: buildGrowthMetric(currentCompletedDonations.length, previousCompletedDonations.length),
      reviews: buildGrowthMetric(
        reviews.filter((item) => inRange(item.createdAt, window.currentStart, window.currentEnd)).length,
        reviews.filter((item) => inRange(item.createdAt, window.previousStart, window.previousEnd)).length,
      ),
      messages: buildGrowthMetric(
        messages.filter((item) => inRange(item.createdAt, window.currentStart, window.currentEnd)).length,
        messages.filter((item) => inRange(item.createdAt, window.previousStart, window.previousEnd)).length,
      ),
    },
    trends: {
      users: buildSeriesFromDocs(users, trendBuckets, (item) => item.createdAt),
      books: buildSeriesFromDocs(books, trendBuckets, (item) => item.createdAt),
      requests: buildSeriesFromDocs(requests, trendBuckets, (item) => item.createdAt),
      donations: buildSeriesFromDocs(donations.filter((item) => COMPLETED_DONATION_STATUSES.includes(item.status)), trendBuckets, getDonationEventDate),
      reviews: buildSeriesFromDocs(reviews, trendBuckets, (item) => item.createdAt),
    },
    highlights: {
      topListingCategories: groupCounts(
        books.filter((item) => inRange(item.createdAt, window.currentStart, window.currentEnd)),
        (item) => item.category,
      ).slice(0, 5),
      topImpactCities: groupCounts(currentCompletedDonations, (donation) => sanitizeLocation(donation.receiverId?.location)).filter((entry) => entry.label !== 'Unknown').slice(0, 5),
      topDonors: groupCounts(currentCompletedDonations, (donation) => donation.donorId?.name).slice(0, 5),
      roleMix: groupCounts(users, (item) => item.role),
    },
  };

  return report;
}

function buildAdminEmailReport(report) {
  const subject = `${report.period === 'monthly' ? 'Monthly' : 'Weekly'} Adopt A Book platform report · ${report.range.currentLabel}`;
  const lines = [
    `${report.period === 'monthly' ? 'Monthly' : 'Weekly'} platform report`,
    `Reporting window: ${report.range.currentLabel}`,
    '',
    `New users: ${report.metrics.newUsers.current} (${report.metrics.newUsers.delta >= 0 ? '+' : ''}${report.metrics.newUsers.delta} vs previous period)`,
    `New books: ${report.metrics.newBooks.current} (${report.metrics.newBooks.delta >= 0 ? '+' : ''}${report.metrics.newBooks.delta} vs previous period)`,
    `New requests: ${report.metrics.newRequests.current} (${report.metrics.newRequests.delta >= 0 ? '+' : ''}${report.metrics.newRequests.delta} vs previous period)`,
    `Completed donations: ${report.metrics.completedDonations.current} (${report.metrics.completedDonations.delta >= 0 ? '+' : ''}${report.metrics.completedDonations.delta} vs previous period)`,
    `Reviews submitted: ${report.metrics.reviews.current}`,
    `Messages sent: ${report.metrics.messages.current}`,
    '',
    'Top listing categories:',
    ...report.highlights.topListingCategories.map((item) => `- ${item.label}: ${item.count}`),
    '',
    'Top impact cities:',
    ...(report.highlights.topImpactCities.length > 0 ? report.highlights.topImpactCities.map((item) => `- ${item.label}: ${item.count} deliveries`) : ['- No completed deliveries this period']),
  ];

  const html = `
    <h1>${report.period === 'monthly' ? 'Monthly' : 'Weekly'} Adopt A Book platform report</h1>
    <p><strong>Window:</strong> ${report.range.currentLabel}</p>
    <ul>
      <li><strong>New users:</strong> ${report.metrics.newUsers.current}</li>
      <li><strong>New books:</strong> ${report.metrics.newBooks.current}</li>
      <li><strong>New requests:</strong> ${report.metrics.newRequests.current}</li>
      <li><strong>Completed donations:</strong> ${report.metrics.completedDonations.current}</li>
      <li><strong>Reviews submitted:</strong> ${report.metrics.reviews.current}</li>
      <li><strong>Messages sent:</strong> ${report.metrics.messages.current}</li>
    </ul>
    <p><strong>Top listing categories:</strong> ${report.highlights.topListingCategories.map((item) => `${item.label} (${item.count})`).join(', ') || 'No new listings'}</p>
    <p><strong>Top impact cities:</strong> ${report.highlights.topImpactCities.map((item) => `${item.label} (${item.count})`).join(', ') || 'No completed deliveries'}</p>
  `;

  return {
    subject,
    text: lines.join('\n'),
    html,
  };
}

module.exports = {
  COMPLETED_DONATION_STATUSES,
  roundTo,
  sanitizeLocation,
  getUserAnalytics,
  getAdminGrowthReport,
  buildAdminEmailReport,
};
