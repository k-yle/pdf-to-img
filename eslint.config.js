import config from "eslint-config-kyle";

const updatedConfig = [...config, { rules: { quotes: "off" } }];

export default updatedConfig;
