/**
 * Seed marketplace categories and starter services.
 * Run: npm run seed:marketplace
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ServiceCategory from '../models/ServiceCategory';
import Service from '../models/Service';
import { slugify } from '../utils/slugify';

dotenv.config();

const CATALOG: Array<{
  name: string;
  nameRw: string;
  services: string[];
}> = [
  { name: 'Labor Supply', nameRw: 'Gushaka Abakozi', services: ['General Labor', 'Skilled Labor', 'Temporary Staffing'] },
  { name: 'Cleaning Services', nameRw: 'Isuku', services: ['Home Cleaning', 'Office Cleaning', 'Deep Cleaning'] },
  { name: 'Security Services', nameRw: 'Umutekano', services: ['Guard Services', 'Event Security', 'CCTV Installation'] },
  { name: 'Construction', nameRw: 'Ubwubatsi', services: ['Building', 'Renovation', 'Masonry'] },
  { name: 'Transportation', nameRw: 'Ubwikorezi', services: ['Taxi', 'Delivery', 'Moving Services'] },
  { name: 'Logistics', nameRw: 'Gutwara Ibintu', services: ['Freight', 'Warehousing', 'Courier'] },
  { name: 'Agriculture', nameRw: 'Ubuhinzi', services: ['Farming Support', 'Livestock Care', 'Agri Consulting'] },
  { name: 'Catering', nameRw: 'Guteka no Gutanga Amafunguro', services: ['Event Catering', 'Meal Delivery', 'Buffet Services'] },
  { name: 'ICT Services', nameRw: 'Ikoranabuhanga', services: ['Web Development', 'IT Support', 'Software Setup'] },
  { name: 'Translation Services', nameRw: 'Gusemura', services: ['Document Translation', 'Interpretation', 'Localization'] },
  { name: 'Real Estate', nameRw: "Ubucuruzi bw'Inzu", services: ['Property Sales', 'Rentals', 'Property Management'] },
  { name: 'Electrical Services', nameRw: 'Amashanyarazi', services: ['Wiring', 'Repairs', 'Solar Installation'] },
  { name: 'Plumbing', nameRw: 'Gukora Amazi', services: ['Pipe Repair', 'Installation', 'Drainage'] },
  { name: 'Hair & Beauty', nameRw: 'Ubwiza', services: ['Hair Styling', 'Makeup', 'Spa Services'] },
  { name: 'Laundry', nameRw: 'Kumesa', services: ['Wash & Fold', 'Dry Cleaning', 'Ironing'] },
  { name: 'Printing Services', nameRw: 'Gucapa', services: ['Document Printing', 'Banners', 'Branding'] },
  { name: 'Consultancy', nameRw: 'Ubujyanama', services: ['Business Consulting', 'Legal Advisory', 'Financial Advice'] },
  { name: 'Medical Services', nameRw: 'Ubuvuzi', services: ['Home Care', 'First Aid Support', 'Health Screening'] },
  { name: 'Babysitting', nameRw: 'Kurera Abana', services: ['Child Care', 'Nanny Services', 'After-school Care'] },
];

async function seedMarketplaceCatalog() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/joblink';
  await mongoose.connect(mongoUri);

  let categoriesCreated = 0;
  let servicesCreated = 0;

  for (let i = 0; i < CATALOG.length; i += 1) {
    const item = CATALOG[i];
    const slug = slugify(item.name);

    const category = await ServiceCategory.findOneAndUpdate(
      { slug },
      {
        slug,
        name: item.name,
        nameRw: item.nameRw,
        sortOrder: i + 1,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (category) categoriesCreated += 1;

    for (let j = 0; j < item.services.length; j += 1) {
      const serviceName = item.services[j];
      const serviceSlug = slugify(serviceName);

      await Service.findOneAndUpdate(
        { categoryId: category._id, slug: serviceSlug },
        {
          categoryId: category._id,
          slug: serviceSlug,
          name: serviceName,
          sortOrder: j + 1,
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      servicesCreated += 1;
    }
  }

  console.log(`Marketplace seed complete: ${categoriesCreated} categories, ${servicesCreated} services.`);
  await mongoose.disconnect();
}

seedMarketplaceCatalog().catch((error) => {
  console.error('Marketplace seed failed:', error);
  process.exit(1);
});
