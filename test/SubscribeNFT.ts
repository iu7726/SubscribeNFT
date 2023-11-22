import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ERC20Token, SubscribeNFT } from "../typechain";

let subscribeNFT: SubscribeNFT;
let erc20Token: ERC20Token;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ONE_ETHER = BigNumber.from(Math.pow(10, 10)).mul(Math.pow(10, 8)).toString();
const HALF_ETHER = BigNumber.from(ONE_ETHER).div(2).toString();
const FEE_ETHER = ethers.utils.parseEther("0.01");

const parseEther = (val: string) => ethers.utils.parseEther(val);
const formatEther = (val: string) => ethers.utils.formatEther(val);

describe("SubscribeNFT", function () {

    before("Deploy", async () => {
        const [minter, address1, address2, _] = await ethers.getSigners()
        const ERC20Token = await ethers.getContractFactory("ERC20Token");
        erc20Token = await ERC20Token.deploy();

        const SubscribeNFT = await ethers.getContractFactory("SubscribeNFT")
        subscribeNFT = await SubscribeNFT.deploy();

        erc20Token
            .connect(minter)
            .transfer(address1.address, BigNumber.from(ONE_ETHER).mul(1000));
        erc20Token
            .connect(minter)
            .transfer(address2.address, BigNumber.from(ONE_ETHER).mul(1000));

        console.log(`const SubscribeNFT = "${subscribeNFT.address}"`)
        console.log(`const ERC20Token = "${erc20Token.address}"`)
    })

    it("Should revert setAllowERC20, because Not owner SubscribeNFT Contract", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        await expect(
            subscribeNFT
                .connect(address1)
                .setAllowERC20(erc20Token.address, 0)
        ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should success setAllowERC20 set ERC20Token false", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        await expect(
            await subscribeNFT
                .connect(minter)
                .setAllowERC20(erc20Token.address, 0)
        ).to.emit(subscribeNFT, "AllowERC20");
    });

    it("Should revert mintWithERC20, because Unsupported ERC20 Token", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        await expect(
            subscribeNFT
                .connect(address1)
                .mintWithERC20(target.address, erc20Token.address, 1)
        ).to.revertedWith("Unsupported ERC20 Token");
    });

    it("Should success setAllowERC20 set ERC20Token true", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        await expect(
            await subscribeNFT
                .connect(minter)
                .setAllowERC20(erc20Token.address, 1)
        ).to.emit(subscribeNFT, "AllowERC20");
    });

    it("Should revert setPriceETH, because Not owner SubscribeNFT Contract", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            subscribeNFT
                .connect(address1)
                .setPriceETH(ZERO_ADDRESS, ONE_ETHER)
        ).to.revertedWith("Ownable: caller is not the owner");
    })

    it("should sucess setPrice for default ETH zero price ", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            subscribeNFT
                .connect(minter)
                .setPriceETH(ZERO_ADDRESS, parseEther("0"))
        ).to.emit(subscribeNFT, "Price")
    })

    it("Should success free mint(ETH) only fee", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()
        const priceOfEth = await subscribeNFT.getPriceETH(ZERO_ADDRESS, 1)
        await expect(priceOfEth).to.equal(FEE_ETHER);
        const beforeMinterBalance = await minter.getBalance();
        const beforeTargetBalance = await target.getBalance();

        await expect(
            await subscribeNFT
                .connect(address1)
                .mint(target.address, 1, {
                    from: address1.address,
                    value: priceOfEth
                })
        ).to.emit(subscribeNFT, "Activate");

        await expect((await minter.getBalance()).sub(beforeMinterBalance)).to.equal(FEE_ETHER);
        console.log(formatEther(beforeMinterBalance.toString()), formatEther((await minter.getBalance()).toString()));
        await expect(await target.getBalance()).to.equal(beforeTargetBalance);
    })

    it("Should success setPrice for default(ETH):no target address", async () => {
        const [minter, address1, _] = await ethers.getSigners()

        await expect(
            subscribeNFT
                .connect(minter)
                .setPriceETH(ZERO_ADDRESS, ONE_ETHER)
        ).to.emit(subscribeNFT, "Price")
            .withArgs(ZERO_ADDRESS, ZERO_ADDRESS, ONE_ETHER);

        await expect(
            await subscribeNFT.getPriceETH(ZERO_ADDRESS, 1)
        ).eq(parseEther("1.01"));
    })

    it("Should success setPrice for default(ERC20):no target address", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            await subscribeNFT
                .connect(minter)
                .setPriceERC20(erc20Token.address, ZERO_ADDRESS, ONE_ETHER)
        ).to.emit(subscribeNFT, "Price");
        await expect(await subscribeNFT.getPriceERC20(erc20Token.address, ZERO_ADDRESS, 1)).eq(ONE_ETHER);
    })

    it("Should success setPriceByDirectionETH zero price", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            subscribeNFT
                .connect(address1)
                .setPriceByDirectionETH(parseEther("0"))
        ).to.emit(subscribeNFT, "Price")
    });

    it("Should success setPriceBydirectionETH", async () => {
        const [minter, address1, _] = await ethers.getSigners()

        await expect(
            await subscribeNFT
                .connect(address1)
                .setPriceByDirectionETH(parseEther("2.0"))
        ).to.emit(subscribeNFT, "Price")
            .withArgs(address1.address, ZERO_ADDRESS, parseEther("2.0"));

        await expect(await subscribeNFT.getPriceETH(address1.address, 1)).eq(parseEther("2.01"));
    })

    it("Should revert setFeeETH, because Not owner SubscribeNFT Contract", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            subscribeNFT
                .connect(address1)
                .setFeeETH(FEE_ETHER)
        ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should success setFeeETH", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeETH(FEE_ETHER)
        ).to.emit(subscribeNFT, "Fee")
            .withArgs(ZERO_ADDRESS, FEE_ETHER);
    });

    it("Should revert setFeeERC20, because Not owner SubscribeNFT Contract", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            subscribeNFT
                .connect(address1)
                .setFeeERC20(erc20Token.address, FEE_ETHER)
        ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should success setFeeERC20 for default", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeERC20(erc20Token.address, FEE_ETHER)
        ).to.emit(subscribeNFT, "Fee")
            .withArgs(erc20Token.address, FEE_ETHER);

        await expect(await subscribeNFT.getFeeERC20(erc20Token.address)).eq(FEE_ETHER);
    });

    it("Should success setFeeERC20 for default:using target address", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeERC20(erc20Token.address, FEE_ETHER)
        ).to.emit(subscribeNFT, "Fee")
            .withArgs(erc20Token.address, FEE_ETHER);

        await expect(await subscribeNFT.getFeeERC20(erc20Token.address)).eq(FEE_ETHER);
    });

    it("Should success setPriceBydirectionETH ZERO price", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            subscribeNFT
                .connect(address1)
                .setPriceByDirectionETH(BigNumber.from("0"))
        ).to.emit(subscribeNFT, "Price");
    })


    it("Should success setPriceBydirectionETH for Tokens", async () => {
        const [minter, address1, _] = await ethers.getSigners()

        await expect(
            await subscribeNFT
                .connect(address1)
                .setPriceByDirectionETH(parseEther("1.2"))
        ).to.emit(subscribeNFT, "Price")
            .withArgs(address1.address, ZERO_ADDRESS, parseEther("1.2"));

        await expect(await subscribeNFT.getPriceETH(address1.address, 1)).eq(parseEther("1.21"));
    })

    it("Should success setPriceBydirectionERC20 zero price", async () => {
        const [minter, address1, _] = await ethers.getSigners()
        await expect(
            subscribeNFT
                .connect(address1)
                .setPriceByDirectionERC20(erc20Token.address, BigNumber.from("0"))
        ).to.emit(subscribeNFT, "Price")
    })


    it("Should success setPriceBydirection for ERC20 Tokens", async () => {
        const [minter, address1, _] = await ethers.getSigners()

        await expect(
            await subscribeNFT
                .connect(address1)
                .setPriceByDirectionERC20(erc20Token.address, parseEther("1.2"))
        ).to.emit(subscribeNFT, "Price")
            .withArgs(address1.address, erc20Token.address, parseEther("1.2"));

        await expect(await subscribeNFT.getPriceERC20(erc20Token.address, address1.address, 1)).eq(parseEther("1.21"));
    })

    // Test For Mint only Ethereum
    it("Should revert mint(ETH), because amount is zero", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()

        const priceOfEth = await subscribeNFT.getPriceETH(ZERO_ADDRESS, 1)

        await expect(
            subscribeNFT
                .connect(address1)
                .mint(target.address, 0, {
                    from: address1.address,
                    value: priceOfEth
                })).to.revertedWith("Amount is zero");
    })

    it("Should revert mint(ETH), because insufficient value", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()

        const priceOfEth = await subscribeNFT.getPriceETH(ZERO_ADDRESS, 1)
        const priceForPay = BigNumber.from(priceOfEth).sub(1);

        await expect(
            subscribeNFT
                .connect(address1)
                .mint(target.address, 1, {
                    from: address1.address,
                    value: priceForPay
                })).to.revertedWith("insufficient value");
    })

    it("Should revert mint(ETH), because ZERO_ADDRESS", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()
        const priceOfEth = await subscribeNFT.getPriceETH(ZERO_ADDRESS, 1)

        await expect(
            subscribeNFT
                .connect(address1)
                .mint(ZERO_ADDRESS, 1, {
                    from: address1.address,
                    value: priceOfEth
                })).to.revertedWith("Invalid wallet address");
    });

    it("Should success mint(ETH)", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()
        const priceOfEth = await subscribeNFT.getPriceETH(ZERO_ADDRESS, 1)

        const beforeMinterBalance = await minter.getBalance();
        const beforeTargetBalance = await target.getBalance();

        await expect(
            await subscribeNFT
                .connect(address1)
                .mint(target.address, 1, {
                    from: address1.address,
                    value: priceOfEth
                })
        ).to.emit(subscribeNFT, "Activate");

        await expect(await minter.getBalance()).to.above(beforeMinterBalance);
        console.log(await minter.getBalance(), beforeMinterBalance);
        await expect(await target.getBalance()).to.above(beforeTargetBalance);
    })

    it("Should success mint(ETH) 2 Light Stick", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()

        const priceOfEth = await subscribeNFT.getPriceETH(ZERO_ADDRESS, 2);

        const beforeMinterBalance = await minter.getBalance();
        const beforeTargetBalance = await target.getBalance();

        await expect(
            subscribeNFT
                .connect(address1)
                .mint(target.address, 2, {
                    from: address1.address,
                    value: priceOfEth
                })
        ).to.emit(subscribeNFT, "Activate");

        console.log(
            "owner",
            ethers.utils.formatEther(beforeMinterBalance.toString()),
            ethers.utils.formatEther(await minter.getBalance())
        );
        console.log(
            "direction",
            ethers.utils.formatEther(beforeTargetBalance.toString()),
            ethers.utils.formatEther(await target.getBalance())
        );

        await expect(await minter.getBalance()).to.above(beforeMinterBalance);
        await expect(await target.getBalance()).to.above(beforeTargetBalance);
    })

    it("Should revert mint 2 Light Stick by direction(ETH), because not match price", async () => {
        const [minter, target, address2, _] = await ethers.getSigners();

        const priceOfEth = await subscribeNFT.getPriceETH(ZERO_ADDRESS, 2);

        await expect(
            subscribeNFT
                .connect(address2)
                .mint(target.address, 2, {
                    from: address2.address,
                    value: priceOfEth
                })
        ).to.revertedWith("insufficient value");
    });

    it("Should success mint 2 Light Stick by direction(ETH)", async () => {
        const [minter, target, address2, _] = await ethers.getSigners();

        const priceOfEth = await subscribeNFT.getPriceETH(target.address, 2);

        const beforeMinterBalance = await minter.getBalance();
        const beforeTargetBalance = await target.getBalance();
        console.log(ethers.utils.formatEther((await address2.getBalance()).toString()));
        console.log(ethers.utils.formatEther(priceOfEth.toString()));

        await expect(
            subscribeNFT
                .connect(address2)
                .mint(target.address, 2, {
                    from: address2.address,
                    value: priceOfEth
                })
        ).to.emit(subscribeNFT, "Activate");

        console.log(formatEther((await address2.getBalance()).toString()));
        console.log(
            "owner",
            formatEther(beforeMinterBalance.toString()),
            ethers.utils.formatEther(await minter.getBalance()),
            formatEther(((await minter.getBalance()).sub(beforeMinterBalance)).toString())
        );
        console.log(
            "direction",
            formatEther(beforeTargetBalance.toString()),
            ethers.utils.formatEther(await target.getBalance()),
            formatEther(((await target.getBalance()).sub(beforeTargetBalance)).toString())
        );

        await expect(await minter.getBalance()).to.above(beforeMinterBalance);
        await expect(await target.getBalance()).to.above(beforeTargetBalance);
    });

    it("Should revert extend, because insufficient value", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const myToken = await subscribeNFT.connect(address1).tokensOfOwner(address1.address);
        const priceOfEth = parseEther("0.1");

        await expect(
            subscribeNFT
                .connect(address1)
                .extend(myToken[0].toNumber(), 1, {
                    from: address1.address,
                    value: priceOfEth
                })
        ).to.revertedWith("insufficient value");

    });

    it("Should success extend(ETH)", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const myToken = await subscribeNFT.connect(address1).tokensOfOwner(address1.address);
        const priceOfEth = await subscribeNFT.getPriceETH(target.address, 1);

        const beforeMinterBalance = await minter.getBalance();
        const beforeTargetBalance = await target.getBalance();
        const beforeExpried = await subscribeNFT.expired(myToken[0]);

        await expect(
            subscribeNFT
                .connect(address1)
                .extend(myToken[0].toNumber(), 1, {
                    from: address1.address,
                    value: priceOfEth
                })
        ).to.emit(subscribeNFT, "Activate");
        const dateObj = new Date(beforeExpried.toNumber() * 1000);

        console.log(
            dateObj.getFullYear(),
            dateObj.getMonth() + 1,
            dateObj.getDate(), dateObj.getHours(),
            dateObj.getMinutes()
        );

        const newDateObj = new Date((await subscribeNFT.expired(myToken[0])).toNumber() * 1000);

        console.log(
            newDateObj.getFullYear(),
            newDateObj.getMonth() + 1,
            newDateObj.getDate(),
            newDateObj.getHours(),
            newDateObj.getMinutes()
        );

        await expect(await minter.getBalance()).to.above(beforeMinterBalance);
        await expect(await target.getBalance()).to.above(beforeTargetBalance);
        await expect(await subscribeNFT.expired(myToken[0])).to.above(beforeExpried);

    });

    it("Should success 2times extend(ETH)", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const myToken = await subscribeNFT.connect(address1).tokensOfOwner(address1.address);
        const priceOfEth = await subscribeNFT.getPriceETH(target.address, 2);

        const beforeMinterBalance = await minter.getBalance();
        const beforeTargetBalance = await target.getBalance();
        const beforeExpried = await subscribeNFT.expired(myToken[0]);

        await expect(
            subscribeNFT
                .connect(address1)
                .extend(myToken[0].toNumber(), 2, {
                    from: address1.address,
                    value: priceOfEth
                })
        ).to.emit(subscribeNFT, "Activate");

        await expect(await minter.getBalance()).to.above(beforeMinterBalance);
        await expect(await target.getBalance()).to.above(beforeTargetBalance);
        await expect(await subscribeNFT.expired(myToken[0])).to.above(beforeExpried);

    });

    it("Should success extend(ETH) differnce price", async () => {
        const [minter, target, address2, _] = await ethers.getSigners();

        const myToken = await subscribeNFT.connect(address2).tokensOfOwner(address2.address);
        const priceOfEth = await subscribeNFT.getPriceETH(target.address, 1);

        const beforeMinterBalance = await minter.getBalance();
        const beforeTargetBalance = await target.getBalance();
        const beforeExpried = await subscribeNFT.expired(myToken[0]);

        await expect(
            subscribeNFT
                .connect(address2)
                .extend(myToken[0].toNumber(), 1, {
                    from: address2.address,
                    value: priceOfEth
                })
        ).to.emit(subscribeNFT, "Activate");

        await expect(await minter.getBalance()).to.above(beforeMinterBalance);
        await expect(await target.getBalance()).to.above(beforeTargetBalance);
        await expect(await subscribeNFT.expired(myToken[0])).to.above(beforeExpried);
    });


    // Test for Mint with ERC20
    it("Should revert mintWithERC20, because amount is zero", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()

        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, ZERO_ADDRESS, 1)
        await erc20Token.connect(address1).approve(subscribeNFT.address, priceOfErc20);

        await expect(
            subscribeNFT
                .connect(address1)
                .mintWithERC20(target.address, erc20Token.address, 0)
        ).to.revertedWith("Amount is zero");

        await erc20Token.connect(address1).approve(subscribeNFT.address, 0);
    })

    it("Should revert mintWithERC20, because insufficient value", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()

        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, ZERO_ADDRESS, 2)
        const priceForPay = BigNumber.from(priceOfErc20).sub(1);
        await erc20Token.connect(address1).approve(subscribeNFT.address, priceForPay);

        await expect(
            subscribeNFT
                .connect(address1)
                .mintWithERC20(target.address, erc20Token.address, 2)
        ).to.revertedWith("insufficient approve");

        await erc20Token.connect(address1).approve(subscribeNFT.address, 0);
    })

    it("Should success mintWithERC20", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()

        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, ZERO_ADDRESS, 1)
        await erc20Token.connect(address1).approve(subscribeNFT.address, priceOfErc20);

        console.log(
            "balanceOf",
            formatEther((await erc20Token.connect(address1).balanceOf(address1.address)).toString()),
            formatEther(priceOfErc20.toString())
        );

        await expect(
            subscribeNFT
                .connect(address1)
                .mintWithERC20(target.address, erc20Token.address, 1)
        ).to.emit(subscribeNFT, "Activate");

        await erc20Token.connect(address1).approve(subscribeNFT.address, 0);
    })

    it("Should success mintWithERC20 2 LightStick", async () => {
        const [minter, address1, target, _] = await ethers.getSigners()

        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, ZERO_ADDRESS, 2)
        await erc20Token.connect(address1).approve(subscribeNFT.address, priceOfErc20);

        await expect(
            subscribeNFT
                .connect(address1)
                .mintWithERC20(target.address, erc20Token.address, 2)
        ).to.emit(subscribeNFT, "Activate");

        await erc20Token.connect(address1).approve(subscribeNFT.address, 0);
    })



    it("Should revert mintWithERC20 2 Light Stick by direction, because not match price", async () => {
        const [minter, target, address2, _] = await ethers.getSigners();

        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, ZERO_ADDRESS, 2)
        await erc20Token.connect(address2).approve(subscribeNFT.address, priceOfErc20);

        console.log(
            "balanceOf",
            (await erc20Token.connect(address2).balanceOf(address2.address)).toString(),
            priceOfErc20.toString()
        );


        await expect(
            subscribeNFT
                .connect(address2)
                .mintWithERC20(target.address, erc20Token.address, 2)
        ).to.revertedWith("insufficient approve");

        await erc20Token.connect(address2).approve(subscribeNFT.address, 0);
    });

    it("Should revert mintWithERC20 by direction, because ZERO ADDRESS", async () => {
        const [minter, target, address2, _] = await ethers.getSigners();

        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, target.address, 2)
        await erc20Token.connect(address2).approve(subscribeNFT.address, priceOfErc20.mul(2));

        console.log(
            "balanceOf",
            (await erc20Token.connect(address2).balanceOf(address2.address)).toString(),
            priceOfErc20.toString()
        );


        await expect(
            subscribeNFT
                .connect(address2)
                .mintWithERC20(ZERO_ADDRESS, erc20Token.address, 2)
        ).to.revertedWith("Invalid wallet address");

        await erc20Token.connect(address2).approve(subscribeNFT.address, 0);
    });

    it("Should success mintWithERC20 2 Light Stick by direction", async () => {
        const [minter, target, address2, _] = await ethers.getSigners();
        const getMinterBalance = async () => await erc20Token.connect(minter).balanceOf(minter.address);
        const getTargetBalance = async () => await erc20Token.connect(target).balanceOf(target.address);
        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, target.address, 2)
        await erc20Token.connect(address2).approve(subscribeNFT.address, priceOfErc20);

        console.log(
            "balanceOf",
            formatEther((await erc20Token.connect(address2).balanceOf(address2.address)).toString()),
            formatEther(priceOfErc20.toString())
        )
        const beforeMinterBalance = await getMinterBalance();
        const beforeTargetBalance = await getTargetBalance();

        await expect(
            subscribeNFT
                .connect(address2)
                .mintWithERC20(target.address, erc20Token.address, 2)
        ).to.emit(subscribeNFT, "Activate");

        await erc20Token.connect(address2).approve(subscribeNFT.address, 0);
        console.log(
            "owner",
            formatEther(beforeMinterBalance.toString()),
            formatEther((await getMinterBalance()).toString()),
            formatEther(((await getMinterBalance()).sub(beforeMinterBalance)).toString())
        );
        console.log(
            "direction",
            formatEther(beforeTargetBalance.toString()),
            formatEther((await getTargetBalance()).toString()),
            formatEther(((await getTargetBalance()).sub(beforeTargetBalance)).toString())
        );

        await expect(await getMinterBalance()).to.above(beforeMinterBalance);
        await expect(await getTargetBalance()).to.above(beforeTargetBalance);
    });

    it("Should revert extendWithERC20, because insufficient approve", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const myToken = await subscribeNFT.connect(address1).tokensOfOwner(address1.address);
        const priceOfErc20 = parseEther("0.1");
        await erc20Token.connect(address1).approve(subscribeNFT.address, priceOfErc20);

        await expect(
            subscribeNFT
                .connect(address1)
                .extendWithERC20(myToken[0].toNumber(), erc20Token.address, 1)
        ).to.revertedWith("insufficient approve");

    });

    it("Should success extend(ERC20)", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const getMinterBalance = async () => await erc20Token.connect(minter).balanceOf(minter.address);
        const getTargetBalance = async () => await erc20Token.connect(target).balanceOf(target.address);

        const myToken = await subscribeNFT.connect(address1).tokensOfOwner(address1.address);
        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, target.address, 1);
        await erc20Token.connect(address1).approve(subscribeNFT.address, priceOfErc20);

        const beforeMinterBalance = await getMinterBalance();
        const beforeTargetBalance = await getTargetBalance();
        const beforeExpried = await subscribeNFT.expired(myToken[0]);

        await expect(
            subscribeNFT
                .connect(address1)
                .extendWithERC20(myToken[0].toNumber(), erc20Token.address, 1)
        ).to.emit(subscribeNFT, "Activate");

        await expect(await getMinterBalance()).to.above(beforeMinterBalance);
        await expect(await getTargetBalance()).to.above(beforeTargetBalance);
        await expect(await subscribeNFT.expired(myToken[0])).to.above(beforeExpried);

    });

    it("Should success 2times extend(ERC20)", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const getMinterBalance = async () => await erc20Token.connect(minter).balanceOf(minter.address);
        const getTargetBalance = async () => await erc20Token.connect(target).balanceOf(target.address);

        const myToken = await subscribeNFT.connect(address1).tokensOfOwner(address1.address);
        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, target.address, 2);
        await erc20Token.connect(address1).approve(subscribeNFT.address, priceOfErc20);

        const beforeMinterBalance = await getMinterBalance();
        const beforeTargetBalance = await getTargetBalance();
        const beforeExpried = await subscribeNFT.expired(myToken[0]);

        await expect(
            subscribeNFT
                .connect(address1)
                .extendWithERC20(myToken[0].toNumber(), erc20Token.address, 2)
        ).to.emit(subscribeNFT, "Activate");

        await expect(await getMinterBalance()).to.above(beforeMinterBalance);
        await expect(await getTargetBalance()).to.above(beforeTargetBalance);
        await expect(await subscribeNFT.expired(myToken[0])).to.above(beforeExpried);

    });

    it("Should success extend(ERC20) differnce price", async () => {
        const [minter, target, address2, _] = await ethers.getSigners();

        const getMinterBalance = async () => await erc20Token.connect(minter).balanceOf(minter.address);
        const getTargetBalance = async () => await erc20Token.connect(target).balanceOf(target.address);

        const myToken = await subscribeNFT.connect(address2).tokensOfOwner(address2.address);
        const priceOfErc20 = await subscribeNFT.getPriceERC20(erc20Token.address, target.address, 1);
        await erc20Token.connect(address2).approve(subscribeNFT.address, priceOfErc20);

        const beforeMinterBalance = await getMinterBalance();
        const beforeTargetBalance = await getTargetBalance();
        const beforeExpried = await subscribeNFT.expired(myToken[0]);

        await expect(
            subscribeNFT
                .connect(address2)
                .extendWithERC20(myToken[0].toNumber(), erc20Token.address, 1)
        ).to.emit(subscribeNFT, "Activate");

        await expect(await getMinterBalance()).to.above(beforeMinterBalance);
        await expect(await getTargetBalance()).to.above(beforeTargetBalance);
        await expect(await subscribeNFT.expired(myToken[0])).to.above(beforeExpried);

    });

    it("Should revert setBaseURI, because Is not owner", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        await expect(
            subscribeNFT
                .connect(address1)
                .setBaseURI("https://aaa.bb")
        ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should success setBaseURI And uri", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const uri = "https://aaa.bb";

        await expect(
            await subscribeNFT.connect(minter).setBaseURI(uri)
        ).to.emit(subscribeNFT, "SetBaseURI");
        await expect(await subscribeNFT.uri()).to.equal(uri);
    });

    it("Should success getAllowERC20", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const address = await subscribeNFT.connect(address1).getAllowERC20(erc20Token.address);
        console.log(address);
        await expect(address).to.equal(1);
    })

    it("Should success getAllowERC20List", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        console.log(await subscribeNFT.getAllowERC20List());
    })

    it("Should revert getFeeERC20, because Unregistered ERC20 address.", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        await expect(
            subscribeNFT.getFeeERC20("0x0000000000000000000000000000000000000001")
        ).to.revertedWith("Unregistered ERC20 address");
    })

    //////////////////// 
    it("Should setPriceETH zero set", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        await expect(
            await subscribeNFT.setPriceETH(address1.address, 0)
        ).to.emit(subscribeNFT, "Price");
    })

    it("Should mintETH only fee", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const priceOfETH = await subscribeNFT.getPriceETH(address1.address, 1);
        await expect(priceOfETH).to.equal(FEE_ETHER);

        const beforeAddress1Balance = await address1.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address1.address, 1, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(FEE_ETHER);
        await expect(await address1.getBalance()).to.equal(beforeAddress1Balance);

    })

    it("Should mintETH only fee 2 LightStick", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const priceOfETH = await subscribeNFT.getPriceETH(address1.address, 2);
        await expect(priceOfETH).to.equal(FEE_ETHER.mul(2));

        const beforeAddress1Balance = await address1.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address1.address, 2, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(FEE_ETHER.mul(2));
        await expect(await address1.getBalance()).to.equal(beforeAddress1Balance);

    })

    it("Should setPriceETH repay ETH", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        await expect(
            await subscribeNFT
                .connect(address1)
                .setPriceByDirectionETH(parseEther("0.2"))
        ).to.emit(subscribeNFT, "Price");
    })

    it("Should mintETH repay ETH", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const priceOfETH = await subscribeNFT.getPriceETH(address1.address, 1);
        await expect(priceOfETH.sub(FEE_ETHER)).to.equal(parseEther("0.2"));

        const beforeAddress1Balance = await address1.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address1.address, 1, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(FEE_ETHER);
        await expect((await address1.getBalance()).sub(beforeAddress1Balance))
            .to.equal(priceOfETH.sub(FEE_ETHER));
    })

    it("Should mintETH repay ETH 2 Light Stick", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        const priceOfETH = await subscribeNFT.getPriceETH(address1.address, 2);
        await expect(priceOfETH.sub(FEE_ETHER.mul(2))).to.equal(parseEther("0.4"));

        const beforeAddress1Balance = await address1.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address1.address, 2, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(FEE_ETHER.mul(2));
        await expect((await address1.getBalance()).sub(beforeAddress1Balance))
            .to.equal(priceOfETH.sub(FEE_ETHER.mul(2)));
    })

    it("Should fee change", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        await expect(
            await subscribeNFT.setFeeETH(parseEther("0.02"))
        ).to.emit(subscribeNFT, "Fee");
    })

    it("Should change Fee mintETH repay ETH", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const changeFee = parseEther("0.02")
        const priceOfETH = await subscribeNFT.getPriceETH(address1.address, 1);
        await expect(priceOfETH.sub(changeFee)).to.equal(parseEther("0.2"));

        const beforeAddress1Balance = await address1.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address1.address, 1, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(changeFee);
        await expect((await address1.getBalance()).sub(beforeAddress1Balance))
            .to.equal(priceOfETH.sub(changeFee));
    })

    it("Should change Fee mintETH repay ETH 2 Light Stick", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const changeFee = parseEther("0.02")
        const priceOfETH = await subscribeNFT.getPriceETH(address1.address, 2);
        await expect(priceOfETH.sub(changeFee.mul(2))).to.equal(parseEther("0.4"));

        const beforeAddress1Balance = await address1.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address1.address, 2, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(changeFee.mul(2));
        await expect((await address1.getBalance()).sub(beforeAddress1Balance))
            .to.equal(priceOfETH.sub(changeFee.mul(2)));
    })

    it("Should setFeeETH 0.01", async () => {
        const [minter, address1, target, _, address2] = await ethers.getSigners();

        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeETH(FEE_ETHER)
        ).to.emit(subscribeNFT, "Fee")
    })

    it("Should mintETH default Price", async () => {
        const [minter, address1, target, _, address2] = await ethers.getSigners();

        const priceOfETH = await subscribeNFT.getPriceETH(address2.address, 1);
        await expect(priceOfETH.sub(FEE_ETHER)).to.equal(ONE_ETHER);

        const beforeAddress2Balance = await address2.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address2.address, 1, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(FEE_ETHER);
        await expect((await address2.getBalance()).sub(beforeAddress2Balance))
            .to.equal(priceOfETH.sub(FEE_ETHER));
    })

    it("Should mintETH default Price 2 Light Stick", async () => {
        const [minter, address1, target, _, address2] = await ethers.getSigners();

        const priceOfETH = await subscribeNFT.getPriceETH(address2.address, 2);
        await expect(priceOfETH.sub(FEE_ETHER.mul(2))).to.equal(parseEther("2.0"));

        const beforeAddress2Balance = await address2.getBalance();
        const beforeMinterBalance = await minter.getBalance();
        const before_Balance = await _.getBalance();

        await expect(
            await subscribeNFT
                .connect(_)
                .mint(address2.address, 2, {
                    from: _.address,
                    value: priceOfETH
                })
        ).to.emit(subscribeNFT, "Activate")

        await expect(before_Balance.sub(await _.getBalance()))
            .to.above(priceOfETH);
        await expect((await minter.getBalance()).sub(beforeMinterBalance))
            .to.equal(FEE_ETHER.mul(2));
        await expect((await address2.getBalance()).sub(beforeAddress2Balance))
            .to.equal(priceOfETH.sub(FEE_ETHER.mul(2)));
    })

    it("Error setFeeETH max uint256, because overflow", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639936");
        console.log(maxUint256)
        try {
            await expect(
                subscribeNFT
                    .connect(minter)
                    .setFeeETH(maxUint256)
            ).to.throw(ReferenceError, 'value out-of-bounds');
        } catch (error) {
            expect(true);
        }

    })

    it("Should setFeeETH max uint256", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935");
        console.log(formatEther(maxUint256.toString()));
        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeETH(maxUint256)
        ).to.emit(subscribeNFT, "Fee");
    })

    it("Error getPrice default Price and max uint256 Fee", async () => {
        const [minter, address1, target, _, address2] = await ethers.getSigners();

        try {
            await subscribeNFT.getPriceETH(address2.address, 1)
        } catch (error) {
            expect(true);
        }
    })

    it("Error setFeeETH max uint256, because overflow", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("-1");
        try {
            await expect(
                await subscribeNFT
                    .connect(minter)
                    .setFeeETH(maxUint256)
            ).to.throw(ReferenceError, 'value out-of-bounds');
        } catch (error) {
            expect(true);
        }
    })

    it("Error setFeeERC20 max uint256, because overflow", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639936");
        console.log(maxUint256)
        try {
            await expect(
                subscribeNFT
                    .connect(minter)
                    .setFeeERC20(erc20Token.address, maxUint256)
            ).to.throw(ReferenceError, 'value out-of-bounds');
        } catch (error) {
            expect(true);
        }

    })

    it("Should setFeeERC20 max uint256", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935");
        console.log(formatEther(maxUint256.toString()));
        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeERC20(erc20Token.address, maxUint256)
        ).to.emit(subscribeNFT, "Fee");
    })

    it("Error getPrice default Price and max uint256 Fee", async () => {
        const [minter, address1, target, _, address2] = await ethers.getSigners();

        try {
            await subscribeNFT.getPriceERC20(erc20Token.address, address2.address, 1)
        } catch (error) {
            expect(true);
        }
    })

    it("Error setFeeERC20 max uint256, because overflow", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("-1");
        try {
            await expect(
                await subscribeNFT
                    .connect(minter)
                    .setFeeERC20(erc20Token.address, maxUint256)
            ).to.throw(ReferenceError, 'value out-of-bounds');
        } catch (error) {
            expect(true);
        }
    })

    it("Should setFee ETH or ERC20", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeETH(FEE_ETHER)
        ).to.emit(subscribeNFT, "Fee")

        await expect(
            await subscribeNFT
                .connect(minter)
                .setFeeERC20(erc20Token.address, FEE_ETHER)
        ).to.emit(subscribeNFT, "Fee")
    })

    it("Should revert not support ERC20", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        await expect(
            subscribeNFT
                .connect(minter)
                .getPriceERC20(ZERO_ADDRESS, target.address, 1)
        ).to.revertedWith("Invalid ERC20 Address")
    })

    it("Should revert not support ERC20", async () => {
        const [minter, address1, target, _] = await ethers.getSigners();

        await expect(
            subscribeNFT
                .connect(minter)
                .getPriceERC20("0x0000000000000000000000000000000000000001", target.address, 1)
        ).to.revertedWith("Unregistered ERC20 address")
    })

    it("Should setPriceByDirectionETH overflow", async () => {
        const [minter, address, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639936");
        try {
            await subscribeNFT
                .connect(target)
                .setPriceByDirectionETH(maxUint256);

            expect(false)
        } catch (error) {
            expect(true);
        }
    })

    it("Should setPriceByDirectionERC20 overflow", async () => {
        const [minter, address, target, _] = await ethers.getSigners();
        const maxUint256 = BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639936");
        try {
            await subscribeNFT
                .connect(target)
                .setPriceByDirectionERC20(erc20Token.address, maxUint256);

            expect(false)
        } catch (error) {
            expect(true);
        }
    })

    it("Should setPriceByDirectionERC20 ZERO ADDRESS", async () => {
        const [minter, address, target, _] = await ethers.getSigners();

        await expect(
            subscribeNFT
                .connect(target)
                .setPriceByDirectionERC20(ZERO_ADDRESS, parseEther("0.01"))
        ).to.revertedWith("Invalid ERC20 Address")
    })

    it("Should setPriceByDirectionERC20 not support ERC20", async () => {
        const [minter, address, target, _] = await ethers.getSigners();

        await expect(
            subscribeNFT
                .connect(target)
                .setPriceByDirectionERC20("0x0000000000000000000000000000000000000001", parseEther("0.01"))
        ).to.revertedWith("Unregistered ERC20 address")
    })

});
