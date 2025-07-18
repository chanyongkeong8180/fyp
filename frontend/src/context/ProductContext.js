import { createContext, useReducer } from 'react';

export const ProductsContext = createContext();

export const productsReducer = (state, action) => {
    switch (action.type) {
        case `SET_PRODUCTS`:
            return {
                products: action.payload
            };
        case `CREATE_PRODUCT`:
            return {
                products: [action.payload, ...state.products]
            };
        default:
            return state;
    }
}

export const ProductsContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(productsReducer, {
        products: null
    })

    console.log('ProductsContext state updated:', state); // Debug log

    return (
        <ProductsContext.Provider value={{...state, dispatch}}>
            {children}
        </ProductsContext.Provider>
    )
}