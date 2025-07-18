// --- START OF UPDATED FILE: ShoppingCartPage.js ---
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from './hooks/useCartContext';
import { useAuthContext } from './hooks/useAuthContext'; // Import AuthContext
import './Website.css';
import Header from './Header';
import Footer from './Footer';
import { SHIPPING_FEE } from './shippingConstants';
import { GST_RATE } from './taxConstants';

function ShoppingCartPage() {
    const navigate = useNavigate();
    const { cartItems, dispatch } = useCartContext();
    const { user } = useAuthContext(); // Get user from context

    const [subtotal, setSubtotal] = useState(0);
    const [gst, setGst] = useState(0);
    
    const [savedItems, setSavedItems] = useState(() => {
        try {
            const localData = localStorage.getItem('savedForLater');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Could not parse saved items from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('savedForLater', JSON.stringify(savedItems));
        } catch (error) {
            console.error("Could not save items to localStorage", error);
        }
    }, [savedItems]);


    useEffect(() => {
        const calculatedSubtotal = cartItems.reduce((acc, item) => {
            const itemPrice = typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : item.price;
            return acc + item.quantity * itemPrice;
        }, 0);
        
        const calculatedGst = calculatedSubtotal * GST_RATE;

        setSubtotal(calculatedSubtotal);
        setGst(calculatedGst);

    }, [cartItems]);

    const handleQuantityChange = (itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile, change) => {
        const item = cartItems.find(item => 
            item.id === itemId &&
            item.type === type &&
            item.shape === shape &&
            item.size === size &&
            item.material === material &&
            item.thickness === thickness &&
            item.topImageFile === topImageFile &&
            item.bottomImageFile === bottomImageFile);
        if (item) {
            dispatch({
                type: 'UPDATE_QUANTITY',
                payload: { id: itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile, quantity: Math.max(1, item.quantity + change) }
            });
        }
    };

    const handleDeleteItem = (itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: { id: itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile } });
    };

    const handleSaveForLater = (itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile) => {
        const item = cartItems.find(item => 
            item.id === itemId &&
            item.type === type &&
            item.shape === shape &&
            item.size === size &&
            item.material === material &&
            item.thickness === thickness &&
            item.topImageFile === topImageFile &&
            item.bottomImageFile === bottomImageFile);
        if (item) {
            const isAlreadySaved = savedItems.some(savedItem => 
                savedItem.id === item.id && 
                savedItem.type === item.type && 
                savedItem.shape === item.shape && 
                savedItem.size === item.size && 
                savedItem.material === item.material && 
                savedItem.thickness === item.thickness && 
                savedItem.topImageFile === item.topImageFile &&
                savedItem.bottomImageFile === item.bottomImageFile
            );

            if (!isAlreadySaved) {
                 setSavedItems(prev => [...prev, item]);
            }
           
            dispatch({ type: 'REMOVE_FROM_CART', payload: { id: itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile } });
        }
    };

    const handleMoveToCart = (itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile) => {
        const item = savedItems.find(item => item.id === itemId && item.type === type && item.shape === shape && item.size === size && item.material === material && item.thickness === thickness && item.topImageFile === topImageFile && item.bottomImageFile === bottomImageFile);
        if (item) {
            dispatch({ type: 'ADD_TO_CART', payload: item });
            setSavedItems(prev => prev.filter(savedItem => 
                !(savedItem.id === itemId && 
                  savedItem.type === type && 
                  savedItem.shape === shape && 
                  savedItem.size === size && 
                  savedItem.material === material && 
                  savedItem.thickness === thickness && 
                  savedItem.topImageFile === topImageFile &&
                  savedItem.bottomImageFile === bottomImageFile)
            ));
        }
    };

    const handleDeleteSavedItem = (itemId, type, shape, size, material, thickness, topImageFile, bottomImageFile) => {
        setSavedItems(prev => prev.filter(item => 
            !(item.id === itemId && 
              item.type === type && 
              item.shape === shape && 
              item.size === size && 
              item.material === material && 
              item.thickness === thickness && 
              item.topImageFile === topImageFile && 
              item.bottomImageFile === bottomImageFile)
        ));
    };

    const handleCheckout = () => {
        if (user) {
            navigate('/place-order');
        } else {
            navigate('/login', { state: { from: '/place-order' } });
        }
    };

    return (
        <>
            <Header />
            <div className="container">
                <h2>Shopping Cart</h2>
                <div className="main-cart-items">
                    {cartItems.length === 0 ? (
                        <p>Your shopping cart is empty.</p>
                    ) : (
                        cartItems.map(item => {
                            const itemPrice = typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : item.price;
                            const isCustomItem = item.topImagePreview && item.bottomImagePreview;
                            const imageUrl = item.image ? `${process.env.REACT_APP_API_URL}/images/${item.image}` : null;
                            const itemKey = `${item.id}-${item.type}-${item.shape}-${item.size}-${item.material}-${item.thickness}-${item.topImageFile || ''}-${item.bottomImageFile || ''}`;

                            return (
                                <div className="cart-item" key={itemKey}>
                                    {isCustomItem && (
                                        <>
                                            <span>Top Image</span>
                                            <img src={item.topImagePreview} alt={item.name} />
                                            <span>Bottom Image</span>
                                            <img src={item.bottomImagePreview} alt={item.name} />
                                        </>
                                    )}
                                    {imageUrl && (
                                        <>
                                            <img src={imageUrl} alt={item.name} />
                                        </>
                                    )}
                                    <div className="item-info">
                                        <strong>{item.name}</strong>
                                        <span>Type: {item.type}</span>
                                        <span>Shape: {item.shape}</span>
                                        <span>Size: {item.size}</span>
                                        <span>Material: {item.material}</span>
                                        <span>Thickness: {item.thickness}</span>
                                    </div>
                                    <div className="item-actions">
                                        <div className="quantity-controls">
                                            <button 
                                            onClick={() => handleQuantityChange(item.id, item.type, item.shape, item.size, item.material, item.thickness, item.topImageFile, item.bottomImageFile, -1)} 
                                            disabled={item.quantity === 1}
                                            style={{
                                                pointerEvents: item.quantity === 1 ? 'none' : 'auto', 
                                                opacity: item.quantity === 1 ? 0.5 : 1 }}>
                                            <span>-</span>
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button 
                                            onClick={() => handleQuantityChange(item.id, item.type, item.shape, item.size, item.material, item.thickness, item.topImageFile, item.bottomImageFile, 1)} 
                                            disabled={cartItems
                                                    .filter(cartItem => cartItem.id === item.id)
                                                    .reduce((acc, cartItem) => acc + cartItem.quantity, 0) >= item.warehouse_quantity}
                                            style={{
                                                pointerEvents: cartItems
                                                .filter(cartItem => cartItem.id === item.id)
                                                .reduce((acc, cartItem) => acc + cartItem.quantity, 0) >= item.warehouse_quantity ? 'none' : 'auto',
                                                opacity: cartItems
                                                .filter(cartItem => cartItem.id === item.id)
                                                .reduce((acc, cartItem) => acc + cartItem.quantity, 0) >= item.warehouse_quantity ? 0.5 : 1 }}>
                                            <span>+</span>
                                            </button>
                                        </div>
                                        <button className="action-btn save" onClick={() => 
                                            handleSaveForLater(item.id, item.type, item.shape, item.size, item.material, item.thickness, item.topImageFile, item.bottomImageFile)}>Save for later
                                        </button>
                                        <button className="action-btn delete" onClick={() => 
                                            handleDeleteItem(item.id, item.type, item.shape, item.size, item.material, item.thickness, item.topImageFile, item.bottomImageFile)}>Delete
                                        </button>
                                    </div>
                                    <div className="price-tag">
                                        <span className="item-price-display">${(item.quantity * itemPrice).toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="cart-total">
                    <h3>Cart Total</h3>
                    <p><span>Subtotal</span> <span>${subtotal.toFixed(2)}</span></p>
                    <p><span>Shipment</span> <span>${SHIPPING_FEE.toFixed(2)}</span></p>
                    <p><span>GST ({(GST_RATE * 100).toFixed(0)}%)</span> <span>${gst.toFixed(2)}</span></p>
                    <p className="total-row"><strong>Total</strong> <strong>${(subtotal + SHIPPING_FEE + gst).toFixed(2)}</strong></p>
                    <button 
                    className="complete-purchase-btn" 
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    style={{ 
                        pointerEvents: cartItems.length === 0 ? 'none' : 'auto', 
                        opacity: cartItems.length === 0 ? 0.5 : 1 }}>Complete Purchase</button>
                </div>

                <div className="saved-items">
                    <h3>Saved for Later</h3>
                    {savedItems.length === 0 ? (
                        <p>You have no items saved for later.</p>
                    ) : (
                        savedItems.map(item => {
                            const itemKey = `${item.id}-${item.type}-${item.shape}-${item.size}-${item.material}-${item.thickness}-${item.topImageFile || ''}-${item.bottomImageFile || ''}`;
                            const isCustomItem = item.topImagePreview && item.bottomImagePreview;
                            const imageUrl = item.image ? `${process.env.REACT_APP_API_URL}/images/${item.image}` : null;
                            const itemPrice = typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : item.price;

                            return (
                                <div className="cart-item" key={itemKey}>
                                    {isCustomItem && (
                                        <>
                                            <span>Top Image</span>
                                            <img src={item.topImagePreview} alt={item.name} />
                                            <span>Bottom Image</span>
                                            <img src={item.bottomImagePreview} alt={item.name} />
                                        </>
                                    )}
                                    {imageUrl && (
                                        <img src={imageUrl} alt={item.name} />
                                    )}
                                    <div className="item-info">
                                        <strong>{item.name}</strong>
                                        <span>Type: {item.type}</span>
                                        <span>Shape: {item.shape}</span>
                                        <span>Size: {item.size}</span>
                                        <span>Material: {item.material}</span>
                                        <span>Thickness: {item.thickness}</span>
                                    </div>
                                    <div className="item-actions">
                                        <button className="action-btn save" onClick={() => 
                                            handleMoveToCart(item.id, item.type, item.shape, item.size, item.material, item.thickness, item.topImageFile, item.bottomImageFile)}>Move to Cart
                                        </button>
                                        <button className="action-btn delete" onClick={() => 
                                            handleDeleteSavedItem(item.id, item.type, item.shape, item.size, item.material, item.thickness, item.topImageFile, item.bottomImageFile)}>Delete
                                        </button>
                                    </div>
                                    <div className="price-tag">
                                        <span className="item-price-display">${itemPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default ShoppingCartPage;
// --- END OF UPDATED FILE: ShoppingCartPage.js ---//