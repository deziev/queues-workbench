export const delay = async (ms: number): Promise<{}> => {
  return new Promise((resolve) => {
    setTimeout((e) => {
      resolve(e);
    }, ms);
  });
};
