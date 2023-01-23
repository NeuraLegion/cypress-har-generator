export default async req => {
  try {
    return /\{"products":\[/.test(req.response.content.text ?? '');
  } catch {
    return false;
  }
};
