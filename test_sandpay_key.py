#!/usr/bin/env python3
"""
杉德河马支付密钥诊断工具
独立运行，无需数据库，支持两种模式：
1. 通过API读取服务器配置（需提供服务器地址和管理员token）
2. 直接粘贴私钥测试

用法: python test_sandpay_key.py
"""
import os
import sys
import base64
import json
import urllib.request

def analyze_and_test_key(private_key_text, public_key_text="", label=""):
    """分析并测试密钥"""
    if label:
        print(f"\n{'='*60}")
        print(f"诊断: {label}")
        print(f"{'='*60}")

    private_key = (private_key_text or "").strip()
    if not private_key:
        print("\n[错误] 私钥为空！")
        return False

    # 1. 分析格式
    print(f"\n[1] 分析私钥格式...")
    raw = private_key.replace("\\n", "\n").strip()
    print(f"  原始长度: {len(private_key)} 字符")
    print(f"  包含 BEGIN: {'BEGIN' in raw}")
    print(f"  包含 PRIVATE KEY: {'PRIVATE KEY' in raw}")
    print(f"  包含 RSA PRIVATE KEY: {'RSA PRIVATE KEY' in raw}")
    print(f"  前100字符: {repr(raw[:100])}")

    # 去除PEM头尾
    if "BEGIN" in raw:
        lines = raw.split("\n")
        b64_body = "".join(l.strip() for l in lines if not l.startswith("-----"))
    else:
        b64_body = raw.replace("\n", "").replace(" ", "")

    print(f"  Base64内容长度: {len(b64_body)}")

    try:
        key_bytes = base64.b64decode(b64_body)
        print(f"  Base64解码成功，{len(key_bytes)} 字节")
        print(f"  前16字节(hex): {key_bytes[:16].hex()}")
        # PKCS#1/PKCS#8都以 0x30 0x82 开头
        if key_bytes[:2] == b'\x30\x82':
            print(f"  ASN.1头部: 30 82 (SEQUENCE)")
            # PKCS#8 在第4字节后是 0x02 0x01 0x00 (INTEGER, length=1, value=0)
            if len(key_bytes) > 5 and key_bytes[4:7] == b'\x02\x01\x00':
                print("  推测格式: PKCS#8 (PRIVATE KEY)")
            else:
                print("  推测格式: PKCS#1 (RSA PRIVATE KEY)")
    except Exception as e:
        print(f"  Base64解码失败: {e}")
        print("  私钥可能包含非Base64字符，请检查是否有乱码或多余空格")

    # 2. 尝试加载
    print(f"\n[2] 尝试加载私钥...")
    from cryptography.hazmat.primitives import serialization

    # 构建所有可能的PEM格式
    test_pems = []
    if "BEGIN" in raw:
        test_pems.append(("原始格式", raw))
        if "RSA PRIVATE KEY" in raw:
            test_pems.append(("PKCS#8转换", raw.replace("RSA PRIVATE KEY", "PRIVATE KEY")))
        elif "PRIVATE KEY" in raw:
            test_pems.append(("PKCS#1转换", raw.replace("PRIVATE KEY", "RSA PRIVATE KEY")))
    else:
        width = 64
        body = "\n".join(b64_body[i:i+width] for i in range(0, len(b64_body), width))
        test_pems.append(("PKCS#8", f"-----BEGIN PRIVATE KEY-----\n{body}\n-----END PRIVATE KEY-----"))
        test_pems.append(("PKCS#1", f"-----BEGIN RSA PRIVATE KEY-----\n{body}\n-----END RSA PRIVATE KEY-----"))

    loaded_key = None
    for label_name, pem in test_pems:
        try:
            key = serialization.load_pem_private_key(pem.encode("utf-8"), password=None)
            print(f"  [成功] {label_name} - 类型:{type(key).__name__} 位长:{key.key_size}")
            loaded_key = key
            break
        except Exception as e:
            print(f"  [失败] {label_name}: {str(e)[:80]}")

    if not loaded_key:
        print("\n[错误] 所有格式都无法加载！")
        print("\n常见原因:")
        print("  1. 私钥不完整（复制时丢失了部分内容）")
        print("  2. 私钥被加密了（杉德河马需要未加密的明文私钥）")
        print("  3. 密钥类型不是RSA（杉德河马只支持RSA密钥）")
        print("  4. 包含不可见字符（BOM、零宽字符等）")
        # 检查不可见字符
        invisible = [c for c in private_key if ord(c) < 32 and c not in '\n\r\t']
        if invisible:
            print(f"\n  [警告] 发现不可见字符: {[hex(ord(c)) for c in invisible[:5]]}")
            # 清理后重试
            cleaned = ''.join(c for c in private_key if ord(c) >= 32 or c in '\n')
            print(f"  尝试清理后重试...")
            raw_c = cleaned.replace("\\n", "\n").strip()
            if "BEGIN" not in raw_c:
                b64_c = raw_c.replace("\n", "").replace(" ", "")
                try:
                    key_bytes_c = base64.b64decode(b64_c)
                    body_c = "\n".join(b64_c[i:i+64] for i in range(0, len(b64_c), 64))
                    for fmt in ["PRIVATE KEY", "RSA PRIVATE KEY"]:
                        try:
                            pem_c = f"-----BEGIN {fmt}-----\n{body_c}\n-----END {fmt}-----"
                            key = serialization.load_pem_private_key(pem_c.encode("utf-8"), password=None)
                            print(f"  [成功] 清理后加载成功 ({fmt})")
                            loaded_key = key
                            break
                        except:
                            pass
                except:
                    pass
        if not loaded_key:
            return False

    # 3. 测试签名
    print(f"\n[3] 测试RSA2签名...")
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding

    test_params = {"mid": "TEST", "outOrderNo": "TEST123", "amount": 0.01}
    sign_content = "&".join(f"{k}={test_params[k]}" for k in sorted(test_params))
    try:
        sig = loaded_key.sign(sign_content.encode("utf-8"), padding.PKCS1v15(), hashes.SHA256())
        print(f"  [成功] 签名正常，长度{len(base64.b64encode(sig))}字符")
    except Exception as e:
        print(f"  [失败] 签名失败: {e}")
        return False

    # 4. 测试公钥
    if public_key_text and public_key_text.strip():
        print(f"\n[4] 测试公钥...")
        raw_pub = public_key_text.strip().replace("\\n", "\n")
        if "BEGIN" not in raw_pub:
            b64_pub = raw_pub.replace("\n", "").replace(" ", "")
            body_pub = "\n".join(b64_pub[i:i+64] for i in range(0, len(b64_pub), 64))
            pem_pub = f"-----BEGIN PUBLIC KEY-----\n{body_pub}\n-----END PUBLIC KEY-----"
        else:
            pem_pub = raw_pub

        try:
            pub_key = serialization.load_pem_public_key(pem_pub.encode("utf-8"))
            print(f"  [成功] 公钥加载成功")
            try:
                pub_key.verify(sig, sign_content.encode("utf-8"), padding.PKCS1v15(), hashes.SHA256())
                print(f"  [成功] 验签通过，密钥对匹配")
            except:
                print(f"  [警告] 验签失败，公钥和私钥可能不匹配")
        except Exception as e:
            # 尝试 RSA PUBLIC KEY
            if "PUBLIC KEY" in pem_pub and "RSA PUBLIC KEY" not in pem_pub:
                try:
                    pub_key = serialization.load_pem_public_key(
                        pem_pub.replace("PUBLIC KEY", "RSA PUBLIC KEY").encode("utf-8"))
                    print(f"  [成功] 公钥加载成功 (RSA PUBLIC KEY)")
                except:
                    print(f"  [失败] 公钥加载失败: {e}")

    return True

def fetch_config_from_api(base_url, token):
    """通过API获取服务器配置"""
    print(f"\n从服务器获取配置: {base_url}")
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/admin/pay-api-config",
        headers={"Authorization": token}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if data.get("code") != 200:
        raise RuntimeError(data.get("msg") or "获取配置失败")
    return data.get("config") or {}

def main():
    print("=" * 60)
    print("杉德河马支付密钥诊断工具")
    print("=" * 60)
    print("\n选择模式:")
    print("  1. 通过API读取服务器配置（需服务器地址+管理员token）")
    print("  2. 直接粘贴私钥测试")
    print("  3. 从文件读取私钥")

    try:
        mode = input("\n请选择 (1/2/3): ").strip()
    except (EOFError, KeyboardInterrupt):
        return

    if mode == "1":
        base_url = input("服务器地址 (如 https://xs.openget.cn): ").strip()
        token = input("管理员Token (adm_开头): ").strip()
        if not base_url or not token:
            print("地址和Token不能为空")
            return
        try:
            cfg = fetch_config_from_api(base_url, token)
            print(f"\n获取配置成功")
            print(f"  sandpay_enabled: {cfg.get('sandpay_enabled')}")
            print(f"  sandpay_mid: {cfg.get('sandpay_mid')}")
            print(f"  sandpay_api_url: {cfg.get('sandpay_api_url')}")
            analyze_and_test_key(
                cfg.get("sandpay_private_key", ""),
                cfg.get("sandpay_public_key", ""),
                "杉德河马私钥"
            )
        except Exception as e:
            print(f"获取配置失败: {e}")

    elif mode == "2":
        print("\n粘贴私钥（粘贴完后输入 END 单独一行结束）:")
        lines = []
        while True:
            try:
                line = input()
                if line.strip().upper() == "END":
                    break
                lines.append(line)
            except (EOFError, KeyboardInterrupt):
                break
        private_key = "\n".join(lines)

        print("\n粘贴公钥（可跳过，输入 END 结束）:")
        lines2 = []
        while True:
            try:
                line = input()
                if line.strip().upper() == "END":
                    break
                lines2.append(line)
            except (EOFError, KeyboardInterrupt):
                break
        public_key = "\n".join(lines2)

        analyze_and_test_key(private_key, public_key, "粘贴的私钥")

    elif mode == "3":
        path = input("私钥文件路径: ").strip().strip('"').strip("'")
        if not os.path.exists(path):
            print(f"文件不存在: {path}")
            return
        with open(path, "r", encoding="utf-8") as f:
            private_key = f.read()
        analyze_and_test_key(private_key, "", f"文件: {path}")
    else:
        print("无效选择")

    print(f"\n{'='*60}")
    print("诊断完成")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
