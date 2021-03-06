import { Component } from 'react';
import tokenList from "./tokenList.json";
import { Row, Col, Input, Select, message, Spin } from 'antd';
import styles from './style.less';
import { getTokenBalance, getTokenDecimal, isValidAddress, getTokenSymbol } from '../utils/chainHelper';
import BigNumber from 'bignumber.js';

const { Option } = Select;
const { Search } = Input;

class TokenInfo extends Component {

  constructor(props) {
    super(props);

    this.state = {
      tokenSymbol: "",
      tokenAddress: "",
      balance: "",
      amount: "",
      decimal: 0,
      tokenAddressDisable: true,
      loading: false,
      amountDisable: true
    }
  }

  onChange = (value) => {
    let tokenAddress = "";
    if (this.props.userAddress === '') {
      message.warn("Please select your wallet before trade.");
      return;
    }
    if (value === 'Custom Token') {
      this.setState({ tokenSymbol: value, tokenAddressDisable: false, tokenAddress, loading: false, amountDisable: true, balance: "", amount: "" });
    } else {
      tokenAddress = (tokenList.find((v, i) => { return v.symbol === value })).tokenAddress;
      this.setState({ tokenSymbol: value, tokenAddressDisable: true, tokenAddress, loading: true, amount: 0, amountDisable: true });
      this.props.updateInfo(this.state.amount, tokenAddress, value);
      setTimeout(async () => {
        try {
          let balance = await getTokenBalance(tokenAddress, this.props.userAddress);
          let decimal = await getTokenDecimal(tokenAddress);
          this.setState({ loading: false, balance, decimal, amountDisable: false });
        } catch (error) {
          message.warn("Get token balance failed");
          this.setState({ loading: false });
        }
      }, 0);
    }
  }

  onTokenAddressChange = async (e) => {
    try {
      let tokenAddress = e.target.value ? e.target.value.toLowerCase() : "";
      let isValid = isValidAddress(tokenAddress);
      if (!isValid) {
        this.setState({ loading: false, balance: "", tokenAddress, amountDisable: true, amount: "" });
        return;
      }
      let symbol = await getTokenSymbol(tokenAddress);
      this.setState({ tokenAddress, loading: true, tokenSymbol: symbol });
      this.props.updateInfo(this.state.amount, tokenAddress, symbol);
      setTimeout(async () => {
        try {
          let balance = await getTokenBalance(tokenAddress, this.props.userAddress);
          this.setState({ loading: false, balance, amountDisable: balance === 0 });
        } catch (error) {
          message.error('Get token balance failed, please check the token address is valid');
          this.setState({ loading: false, balance: '', amountDisable: true, amount: "" });
        }
      }, 0);
    } catch (err) {
      message.error('Check token address failed, please check the token address is valid');
      console.log(err);
    }
  }

  onTokenAmountChange = (e) => {
    let amount = e.target.value;
    if (amount === '') {
      this.setState({ amount: '' });
      return;
    }

    if (isNaN(Number(amount))) {
      return;
    }

    const { balance, decimal } = this.state;
    if (amount.includes('.')) {
      let splitAmount = amount.split('.')[1];
      if (splitAmount.length > decimal) {
        message.warn("The Token's decimal is " + decimal);
        return;
      }
    }


    if (balance !== '') {
      if (new BigNumber(amount).gt(balance)) {
        message.warn("Amount out of balance");
        this.setState({ amount: 0 });
        return;
      }
    }

    this.setState({ amount });
    this.props.updateInfo(amount, this.state.tokenAddress, this.state.tokenSymbol);
  }

  render() {
    const { data, isDisabled, type } = this.props;
    let vTokenList = tokenList.slice();
    vTokenList.push({
      "symbol": "Custom Token",
      "tokenAddress": ""
    });
    return (
      <div className={styles["border"]}>
        <Row><h3>{this.props.title}</h3></Row>
        <Row>
          <Col span={6} className="leftLabel">
            <p>Token:</p>
          </Col>
          <Col span={18} className={styles['paddingRight']}>
            <Select style={{ width: "100%" }} disabled={isDisabled === true} onChange={this.onChange} value={data ? data.tokenSymbol : this.state.tokenSymbol}>
              {
                vTokenList.map((v, i) => {
                  return (
                    <Option value={v.symbol} key={v.symbol}>
                      {v.symbol}
                    </Option>
                  );
                })
              }
            </Select>
          </Col>
        </Row>
        <Row>
          <Col span={6} className="leftLabel">
            <p>Token SC Address:</p>
          </Col>
          <Col span={18} className={styles['paddingRight']}>
            <Input disabled={this.state.tokenAddressDisable} value={data ? data.tokenAddress : this.state.tokenAddress} onChange={this.onTokenAddressChange} />
          </Col>
        </Row>
        <Row>
          <Col span={6} className="leftLabel">
            <p>Wallet Address:</p>
          </Col>
          <Col span={18} className={styles['paddingRight']}>
            <Input disabled={true} value={data ? data.address : this.props.userAddress} />
          </Col>
        </Row>
        <Row>
          <Spin spinning={this.state.loading}>
            <Col span={6} className="leftLabel">
              <p>Current Balance:</p>
            </Col>
            <Col span={18} className={styles['paddingRight']}>
              <Input disabled={true} value={data ? data.balance : this.state.balance} suffix={data ? data.tokenSymbol : this.state.tokenSymbol} />
            </Col>
          </Spin>
        </Row>
        <Row>
          <Spin spinning={this.state.loading}>
            <Col span={6} className="leftLabel">
              {
                type === 'sell' ? <p>Sell Amount:</p> : <p>Buy Amount:</p>
              }
            </Col>
            <Col span={18} className={styles['paddingRight']}>
              <Input disabled={isDisabled || this.props.verify || this.state.amountDisable} value={data ? data.amount : this.state.amount} onChange={this.onTokenAmountChange} suffix={data ? data.tokenSymbol : this.state.tokenSymbol} />
            </Col>
          </Spin>
        </Row>
      </div>
    );
  }
}

export default TokenInfo;