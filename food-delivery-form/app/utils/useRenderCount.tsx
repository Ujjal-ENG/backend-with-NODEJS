/* eslint-disable react/display-name */
export const getRenderCount = () => {
  let count = 0;
  return () => {
    count++;
    return <div className="text-black">Render Count: {count / 2}</div>;
  };
};
