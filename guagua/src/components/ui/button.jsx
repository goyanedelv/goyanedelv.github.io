const Button = ({ children, ...props }) => (
    <button className="bg-blue-500 text-white p-2 rounded" {...props}>{children}</button>
  );