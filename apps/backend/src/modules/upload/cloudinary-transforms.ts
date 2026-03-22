export const CLOUDINARY_TRANSFORMS = {
  PROFILE_AVATAR: {
    width: 200,
    height: 200,
    crop: "fill",
    gravity: "face",
    quality: "auto",
    fetch_format: "auto",
  },
  MERCHANT_BANNER: {
    width: 1200,
    height: 400,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  },
  PRODUCT_FEED: {
    width: 400,
    height: 400,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  },
  PRODUCT_DETAIL: {
    width: 800,
    quality: "auto",
    fetch_format: "auto",
  },
  CATEGORY_ICON: {
    width: 100,
    height: 100,
    crop: "fill",
    quality: "auto",
    fetch_format: "auto",
  },
};
