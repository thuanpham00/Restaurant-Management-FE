import React from 'react';
import Header from "src/Client/Components/HeaderClient"
import Footer from "src/Client/Components/FooterClient"
import { assets } from 'src/Assets/assets';
// MenuItem Component
interface MenuItemProps {
  item: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
  };
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  return (
    <div className="min-w-[300px] max-w-[350px] bg-gray-800 rounded-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2 flex-shrink-0">
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{item.name}</h3>
        <p className="text-gray-400 text-sm mb-3 h-12 overflow-hidden">
          {item.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-orange-400">
            ${item.price}
          </span>
          <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors">
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
};

// MenuSection Component
interface MenuSectionProps {
  title: string;
  items: {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
  }[];
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, items }) => {
  return (
    <section className="py-8">
      <h2 className="text-3xl font-bold text-white mb-6">{title}</h2>
      <div className="flex flex-wrap gap-8">
        {items.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

// Banner Component
const Banner = () => {
  return (
    <div className="relative my-16 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/50">
        <img
          src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
          alt="Food background"
          className="w-full h-full object-cover mix-blend-overlay"
        />
      </div>
      <div className="relative py-20 px-8 md:px-16 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-serif mb-3">
          Food Is Not Just
        </h2>
        <h2 className="text-4xl md:text-5xl font-serif mb-6">Eating Energy</h2>
        <p className="text-gray-300 mb-8">It's an experience.</p>
        <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-6 rounded-md transition-colors">
          Order Now
        </button>
      </div>
    </div>
  );
};

// App Component
export function App() {
  const menuData = {
    breakfast: [
      {
        id: 1,
        name: 'Egg Frittata Muffins',
        description: 'Fluffy egg muffins with spinach, cherry tomatoes, and feta cheese',
        price: 12,
        image: assets.rectangles.egg,
      },
      {
        id: 2,
        name: 'Breakfast Bowl',
        description: 'Steel-cut oats topped with fresh berries, banana, and honey drizzle',
        price: 10,
        image: assets.rectangles.Breakfast_Bowl,
      },
      {
        id: 3,
        name: 'Breakfast Sandwiches',
        description: 'Fresh croissant filled with scrambled eggs, avocado, and bacon',
        price: 14,
        image: assets.rectangles.Breakfast_Sandwich,
      },
    ],
    lunch: [
      {
        id: 4,
        name: 'Crispy Chicken Burger',
        description: 'Buttermilk fried chicken with special sauce and pickles on a brioche bun',
        price: 16,
        image: assets.rectangles.Burger,
      },
      {
        id: 5,
        name: 'Schezwan Noodles',
        description: 'Hand-pulled noodles with house chili oil sauce and seasonal vegetables',
        price: 14,
        image: assets.rectangles.Noodles,
      },

    ],
    dinner: [
      {
        id: 7,
        name: 'Grilled Salmon',
        description: 'Wild-caught salmon with lemon herb butter, served with roasted vegetables',
        price: 24,
        image: assets.rectangles.salmon,
      },
      {
        id: 8,
        name: 'Ribeye Steak',
        description: 'Prime cut ribeye with truffle butter and garlic mashed potatoes',
        price: 32,
        image: assets.rectangles.steak,
      },
      {
        id: 9,
        name: 'Mushroom Risotto',
        description: 'Creamy arborio rice with wild mushrooms, parmesan, and fresh herbs',
        price: 18,
        image: assets.rectangles.mushroom,
      },
    ],
    starters: [
      {
        id: 10,
        name: 'Truffle Fries',
        description: 'Hand-cut fries tossed with truffle oil, parmesan, and fresh herbs',
        price: 9,
        image: assets.rectangles.fries,
      },
      {
        id: 11,
        name: 'Avocado Tartare',
        description: 'Fresh avocado with citrus, chili flakes, and house-made tortilla chips',
        price: 11,
        image: assets.rectangles.avocado,
      },
      {
        id: 12,
        name: 'Crispy Calamari',
        description: 'Lightly fried calamari served with lemon aioli and marinara sauce',
        price: 13,
        image: assets.rectangles.crispy,
      },
    ],
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
        <Header/>
      <div className="container mx-auto px-4 py-8">
        <MenuSection title="Breakfast" items={menuData.breakfast} />
        <Banner />
        <MenuSection title="Lunch" items={menuData.lunch} />
        <MenuSection title="Dinner" items={menuData.dinner} />
        <MenuSection title="Starters" items={menuData.starters} />
      </div>
      <Footer/>
    </div>
  );
}

export default App;