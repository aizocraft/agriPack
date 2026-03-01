'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const initialState = {
  cartItems: [],
  shippingAddress: {},
  paymentMethod: '',
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'CART_ADD_ITEM': {
      const newItem = action.payload;
      const existItem = state.cartItems.find(
        (item) => item._id === newItem._id
      );

      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((item) =>
            item._id === existItem._id ? newItem : item
          ),
        };
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, newItem],
        };
      }
    }

    case 'CART_REMOVE_ITEM': {
      return {
        ...state,
        cartItems: state.cartItems.filter(
          (item) => item._id !== action.payload
        ),
      };
    }

    case 'CART_UPDATE_ITEM_QTY': {
      const { id, qty } = action.payload;
      return {
        ...state,
        cartItems: state.cartItems.map((item) =>
          item._id === id ? { ...item, qty } : item
        ),
      };
    }

    case 'CART_CLEAR':
      return {
        ...state,
        cartItems: [],
      };

    case 'CART_SAVE_SHIPPING_ADDRESS':
      return {
        ...state,
        shippingAddress: action.payload,
      };

    case 'CART_SAVE_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethod: action.payload,
      };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          parsedCart.forEach((item) => {
            dispatch({ type: 'CART_ADD_ITEM', payload: item });
          });
        }
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
  }, [state.cartItems]);

  const addToCart = (product, qty = 1) => {
    dispatch({
      type: 'CART_ADD_ITEM',
      payload: {
        _id: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        stock: product.stock,
        unit: product.unit,
        qty,
      },
    });
  };

  const removeFromCart = (id) => {
    dispatch({ type: 'CART_REMOVE_ITEM', payload: id });
  };

  const updateCartItemQty = (id, qty) => {
    dispatch({ type: 'CART_UPDATE_ITEM_QTY', payload: { id, qty } });
  };

  const clearCart = () => {
    dispatch({ type: 'CART_CLEAR' });
  };

  const saveShippingAddress = (data) => {
    dispatch({ type: 'CART_SAVE_SHIPPING_ADDRESS', payload: data });
  };

  const savePaymentMethod = (data) => {
    dispatch({ type: 'CART_SAVE_PAYMENT_METHOD', payload: data });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: state.cartItems,
        shippingAddress: state.shippingAddress,
        paymentMethod: state.paymentMethod,
        addToCart,
        removeFromCart,
        updateCartItemQty,
        clearCart,
        saveShippingAddress,
        savePaymentMethod,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
