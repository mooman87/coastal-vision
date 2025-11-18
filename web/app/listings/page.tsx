import Card from '../../components/Card';

const data = [
  { title: 'Seaside Bungalow', subtitle: '$640,000 • 3bd 2ba • Bayview' },
  { title: 'Modern Marina Loft', subtitle: '$480,000 • 2bd 1.5ba • Harbor' },
  { title: 'Lighthouse Cottage', subtitle: '$720,000 • 4bd 3ba • Point Clear' },
  { title: 'Dune Retreat', subtitle: '$540,000 • 3bd 2ba • Sandbar' },
  { title: 'Coral Condo', subtitle: '$420,000 • 1bd 1ba • Boardwalk' },
  { title: 'Pelican Ranch', subtitle: '$590,000 • 4bd 2ba • Tidewater' }
];

export default function ListingsPage() {
  return (
    <section className="container space-y-6">
      <h1 className="text-3xl font-bold">Featured Listings</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d) => (
          <Card key={d.title} title={d.title} subtitle={d.subtitle} />
        ))}
      </div>
    </section>
  );
}