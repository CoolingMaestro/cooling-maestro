// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState } from 'react';
import { Button, Form, Input, Checkbox, Divider, Typography } from 'antd';
import {
UserOutlined,
LockOutlined,
EyeTwoTone,
EyeInvisibleOutlined,
GoogleOutlined,
LinkedinOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom'; // Yeni ekleme
const { Title, Text, Paragraph } = Typography;
const App: React.FC = () => {
const [form] = Form.useForm();
const [showPassword, setShowPassword] = useState<boolean>(false);
const navigate = useNavigate(); // Yeni ekleme
const onFinish = (values: any) => {
console.log('Form values:', values);
navigate('/dashboard'); // Dashboard yönlendirmesi
};
return (
<div className="min-h-screen bg-white flex items-center justify-center">
<div className="flex w-full max-w-6xl h-[600px] shadow-2xl rounded-xl overflow-hidden">
{/* Left Side - Branding */}
<div className="hidden md:flex md:w-2/5 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-10 flex-col justify-between relative overflow-hidden">
<div className="relative z-10">
<div className="flex items-center mb-12">
<img
src="https://readdy.ai/api/search-image?query=A%2520professional%2520sleek%2520modern%2520logo%2520for%2520Cooling%2520Maestro%2520featuring%2520a%2520stylized%2520snowflake%2520or%2520cooling%2520symbol%2520with%2520blue%2520gradient%2520colors.%2520The%2520logo%2520should%2520be%2520minimalist%2520corporate%2520and%2520suitable%2520for%2520an%2520industrial%2520cooling%2520calculation%2520software.%2520Clean%2520background%2520high%2520contrast.&width=60&height=60&seq=1&orientation=squarish"
alt="Cooling Maestro Logo"
className="h-12 w-12 object-contain mr-3"
/>
<div>
<h1 className="text-2xl font-bold">Cooling Maestro</h1>
<p className="text-sm text-blue-100">Endüstriyel Soğutma Çözümleri</p>
</div>
</div>
<Title level={2} className="text-3xl font-bold text-white mb-6">
Cooling Maestro'ya Hoş Geldiniz
</Title>
<Paragraph className="text-blue-100 text-lg mb-8">
Endüstriyel soğutma hesaplamalarınızı hızlı, doğru ve güvenilir bir şekilde yapmanızı sağlayan profesyonel platformumuza hoş geldiniz.
</Paragraph>
<div className="flex items-center space-x-2 text-blue-100">
<i className="fas fa-check-circle text-blue-300"></i>
<span>ASHRAE ve TS EN standartlarına uygun hesaplamalar</span>
</div>
<div className="flex items-center space-x-2 text-blue-100 mt-2">
<i className="fas fa-check-circle text-blue-300"></i>
<span>Profesyonel raporlama ve sistem konfigürasyonu</span>
</div>
<div className="flex items-center space-x-2 text-blue-100 mt-2">
<i className="fas fa-check-circle text-blue-300"></i>
<span>Zaman ve maliyet tasarrufu sağlayan çözümler</span>
</div>
</div>
<img
src="https://readdy.ai/api/search-image?query=A%2520professional%2520illustration%2520of%2520industrial%2520cooling%2520system%2520with%2520abstract%2520digital%2520elements%2520and%2520calculation%2520formulas%2520floating%2520around.%2520The%2520image%2520has%2520a%2520blue%2520gradient%2520background%2520that%2520perfectly%2520matches%2520the%2520login%2520page%2520design.%2520The%2520illustration%2520is%2520modern%2520minimalist%2520and%2520suitable%2520for%2520a%2520professional%2520engineering%2520software%2520interface.&width=500&height=300&seq=2&orientation=landscape"
alt="Industrial Cooling Illustration"
className="absolute bottom-0 right-0 w-full opacity-20 object-cover object-top"
/>
</div>
{/* Right Side - Login Form */}
<div className="w-full md:w-3/5 bg-white p-8 md:p-12 flex flex-col justify-center">
<div className="max-w-md mx-auto w-full">
<div className="md:hidden flex items-center mb-8 justify-center">
<img
src="https://readdy.ai/api/search-image?query=A%2520professional%2520sleek%2520modern%2520logo%2520for%2520Cooling%2520Maestro%2520featuring%2520a%2520stylized%2520snowflake%2520or%2520cooling%2520symbol%2520with%2520blue%2520gradient%2520colors.%2520The%2520logo%2520should%2520be%2520minimalist%2520corporate%2520and%2520suitable%2520for%2520an%2520industrial%2520cooling%2520calculation%2520software.%2520Clean%2520background%2520high%2520contrast.&width=60&height=60&seq=1&orientation=squarish"
alt="Cooling Maestro Logo"
className="h-12 w-12 object-contain mr-3"
/>
<div>
<h1 className="text-2xl font-bold text-gray-800">Cooling Maestro</h1>
<p className="text-sm text-gray-500">Endüstriyel Soğutma Çözümleri</p>
</div>
</div>
<Title level={3} className="text-2xl font-bold text-gray-800 mb-2">
Giriş Yap
</Title>
<Text className="text-gray-500 block mb-8">
Hesabınıza erişmek için giriş yapın
</Text>
<Form
form={form}
name="login"
layout="vertical"
onFinish={onFinish}
autoComplete="off"
className="w-full"
>
<Form.Item
name="email"
rules={[{ required: true, message: 'Lütfen e-posta adresinizi girin!' }]}
>
<Input
size="large"
placeholder="E-posta Adresi"
prefix={<UserOutlined className="text-gray-400" />}
className="rounded-lg py-2 px-4 border-gray-300"
/>
</Form.Item>
<Form.Item
name="password"
rules={[{ required: true, message: 'Lütfen şifrenizi girin!' }]}
className="mb-2"
>
<Input.Password
size="large"
placeholder="Şifre"
prefix={<LockOutlined className="text-gray-400" />}
iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
className="rounded-lg py-2 px-4 border-gray-300"
/>
</Form.Item>
<div className="flex justify-between items-center mb-6">
<Form.Item name="remember" valuePropName="checked" noStyle>
<Checkbox className="text-gray-600">Beni Hatırla</Checkbox>
</Form.Item>
<Button type="link" className="text-blue-600 hover:text-blue-800 p-0 !rounded-button whitespace-nowrap cursor-pointer">
Şifremi Unuttum
</Button>
</div>
<Form.Item>
<Button
type="primary"
htmlType="submit"
size="large"
block
className="h-12 bg-blue-600 hover:bg-blue-700 !rounded-button whitespace-nowrap cursor-pointer"
>
Giriş Yap
</Button>
</Form.Item>
</Form>
<Divider className="my-6">
<span className="text-gray-500">veya</span>
</Divider>
<div className="space-y-4">
<Button
size="large"
block
icon={<GoogleOutlined />}
className="flex items-center justify-center h-12 border-gray-300 hover:border-gray-400 !rounded-button whitespace-nowrap cursor-pointer"
>
Google ile Giriş Yap
</Button>
<Button
size="large"
block
icon={<LinkedinOutlined />}
className="flex items-center justify-center h-12 border-gray-300 hover:border-gray-400 !rounded-button whitespace-nowrap cursor-pointer"
>
LinkedIn ile Giriş Yap
</Button>
</div>
<div className="text-center mt-8">
<Text className="text-gray-600">
Hesabınız yok mu? <Button type="link" className="p-0 text-blue-600 hover:text-blue-800 !rounded-button whitespace-nowrap cursor-pointer">Hemen Kayıt Olun</Button>
</Text>
</div>
</div>
</div>
</div>
</div>
);
};
export default App