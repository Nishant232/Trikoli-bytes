import butterChicken from "@/assets/menu/butter-chicken.jpg";
import biryani from "@/assets/menu/biryani.jpg";
import paneerTikka from "@/assets/menu/paneer-tikka.jpg";
import garlicNaan from "@/assets/menu/garlic-naan.jpg";
import dalMakhani from "@/assets/menu/dal-makhani.jpg";
import samosa from "@/assets/menu/samosa.jpg";
import gulabJamun from "@/assets/menu/gulab-jamun.jpg";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating: number;
  isPopular?: boolean;
}

export const categories = ["All", "Main Course", "Starters", "Breads", "Desserts"];

export const menuItems: MenuItem[] = [
  {
    id: "1",
    name: "Butter Chicken",
    description: "Tender chicken in a rich, creamy tomato-butter sauce with aromatic spices. Served with steamed rice.",
    price: 320,
    image: butterChicken,
    category: "Main Course",
    isVeg: false,
    rating: 4.8,
    isPopular: true,
  },
  {
    id: "2",
    name: "Chicken Biryani",
    description: "Fragrant basmati rice layered with succulent chicken, saffron, and whole spices. Slow-cooked to perfection.",
    price: 280,
    image: biryani,
    category: "Main Course",
    isVeg: false,
    rating: 4.9,
    isPopular: true,
  },
  {
    id: "3",
    name: "Paneer Tikka",
    description: "Chargrilled cottage cheese cubes marinated in spiced yogurt with bell peppers and onions.",
    price: 220,
    image: paneerTikka,
    category: "Starters",
    isVeg: true,
    rating: 4.6,
  },
  {
    id: "4",
    name: "Garlic Naan",
    description: "Soft, fluffy naan bread topped with garlic butter and fresh herbs. Baked in a tandoor oven.",
    price: 60,
    image: garlicNaan,
    category: "Breads",
    isVeg: true,
    rating: 4.5,
  },
  {
    id: "5",
    name: "Dal Makhani",
    description: "Slow-cooked black lentils in a creamy, buttery gravy. A North Indian classic comfort dish.",
    price: 200,
    image: dalMakhani,
    category: "Main Course",
    isVeg: true,
    rating: 4.7,
    isPopular: true,
  },
  {
    id: "6",
    name: "Samosa (2 pcs)",
    description: "Crispy golden pastries filled with spiced potatoes and peas. Served with mint chutney.",
    price: 80,
    image: samosa,
    category: "Starters",
    isVeg: true,
    rating: 4.4,
  },
  {
    id: "7",
    name: "Gulab Jamun",
    description: "Soft, golden milk dumplings soaked in rose-cardamom sugar syrup. A heavenly dessert.",
    price: 120,
    image: gulabJamun,
    category: "Desserts",
    isVeg: true,
    rating: 4.8,
  },
];
