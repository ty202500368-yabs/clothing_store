import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const EMPTY_CART = {
  id: null,
  items: [],
  subtotal: 0,
  total_items: 0,
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { token } = useAuth()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!token) {
      setCart(EMPTY_CART)
      return EMPTY_CART
    }

    setLoading(true)

    try {
      const { data } = await api.get('/cart')
      setCart(data.data || EMPTY_CART)
      return data.data
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setCart(EMPTY_CART)
      return
    }

    refresh().catch(() => setCart(EMPTY_CART))
  }, [token, refresh])

  const addItem = useCallback(async (productVariantId, quantity = 1) => {
    const { data } = await api.post('/cart/items', {
      product_variant_id: productVariantId,
      quantity,
    })
    setCart(data.data || EMPTY_CART)
    return data.data
  }, [])

  const updateItem = useCallback(async (cartItemId, quantity) => {
    const { data } = await api.patch(`/cart/items/${cartItemId}`, { quantity })
    setCart(data.data || EMPTY_CART)
    return data.data
  }, [])

  const removeItem = useCallback(async (cartItemId) => {
    const { data } = await api.delete(`/cart/items/${cartItemId}`)
    setCart(data.data || EMPTY_CART)
    return data.data
  }, [])

  const clear = useCallback(async () => {
    const { data } = await api.delete('/cart')
    setCart(data.data || EMPTY_CART)
  }, [])

  const value = useMemo(
    () => ({
      cart,
      loading,
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, refresh, addItem, updateItem, removeItem, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
