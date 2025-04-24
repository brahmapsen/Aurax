declare module '*.json' {
  const value: {
    address: string;
    abi: any[];
    owner: string;
  };
  export default value;
} 