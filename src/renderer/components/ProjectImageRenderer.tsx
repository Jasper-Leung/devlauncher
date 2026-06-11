import React, { useState } from 'react'

/**
 * 项目图片渲染组件
 * 根据网络状态决定是否显示在线图片
 */
export const ProjectImageRenderer: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { isOnline: boolean }> = ({
  src,
  alt,
  isOnline,
  ...props
}) => {
  // 如果是在线图片但加载失败，显示alt
  const [imgError, setImgError] = useState(false)

  // 判断是否为在线图片
  const isOnlineImage = src?.startsWith('http://') || src?.startsWith('https://')

  // 如果是在线图片但离线状态，则不显示
  if (isOnlineImage && !isOnline) {
    return null
  }

  if (imgError) {
    return <span style={{ color: 'var(--text-secondary)' }}>{alt || src}</span>
  }

  return <img src={src} alt={alt} onError={() => setImgError(true)} {...props as React.ImgHTMLAttributes<HTMLImageElement>} />
}
